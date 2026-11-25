import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BFzmYIr7qrRpwsm8Gdch2Gz0IUFTkGdZO_9H2TmbOGIVWmz1n1HcSbiwZd-A6hDhDy3o3Uk64IQvHZRBkQ8MP_A';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'DDfk56e9DUqfxZMRhfCrr2ToMaqVMdFyksT02Ijbx7w';

const VAPID_SUBJECT = 'mailto:contato@movimentooba.com.br';

function hkdf(
  salt: Buffer,
  ikm: Buffer,
  info: Buffer,
  length: number
): Buffer {
  const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
  const t = crypto
    .createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([1])]))
    .digest();
  return t.subarray(0, length);
}

/**
 * Criptografa o payload JSON segundo a RFC 8291 (aes128gcm) usando apenas Node.js crypto nativo
 */
function encryptWebPushPayload(
  payloadText: string,
  userPublicKeyBase64: string,
  userAuthBase64: string
): Buffer {
  const clientPublicKey = Buffer.from(userPublicKeyBase64, 'base64url');
  const authSecret = Buffer.from(userAuthBase64, 'base64url');

  const localEcdh = crypto.createECDH('prime256v1');
  const serverPublicKey = localEcdh.generateKeys();
  const sharedSecret = localEcdh.computeSecret(clientPublicKey);

  const salt = crypto.randomBytes(16);

  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'utf8'),
    clientPublicKey,
    serverPublicKey,
  ]);
  const ikm = hkdf(authSecret, sharedSecret, keyInfo, 32);

  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'utf8');
  const contentEncryptionKey = hkdf(salt, ikm, cekInfo, 16);

  const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'utf8');
  const nonce = hkdf(salt, ikm, nonceInfo, 12);

  const plaintext = Buffer.concat([Buffer.from(payloadText, 'utf8'), Buffer.from([2])]);
  const cipher = crypto.createCipheriv('aes-128-gcm', contentEncryptionKey, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096, 0);
  const idlen = Buffer.from([serverPublicKey.length]);

  return Buffer.concat([salt, rs, idlen, serverPublicKey, encrypted]);
}

/**
 * Envia notificação Web Push via protocolo RFC 8291 / VAPID (100% nativo em Node.js)
 */
async function sendWebPushNotification(
  subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } },
  payloadString: string
): Promise<boolean> {
  try {
    const parsedUrl = new URL(subscription.endpoint);
    const audience = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url');
    const jwtPayload = Buffer.from(
      JSON.stringify({ aud: audience, exp, sub: VAPID_SUBJECT })
    ).toString('base64url');

    const unsignedToken = `${header}.${jwtPayload}`;

    const pubBytes = Buffer.from(VAPID_PUBLIC_KEY, 'base64url');
    const x = pubBytes.subarray(1, 33).toString('base64url');
    const y = pubBytes.subarray(33, 65).toString('base64url');

    const privateKey = crypto.createPrivateKey({
      key: {
        kty: 'EC',
        crv: 'P-256',
        x,
        y,
        d: VAPID_PRIVATE_KEY,
      },
      format: 'jwk',
    });

    const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
      key: privateKey,
      dsaEncoding: 'ieee-p1363',
    });

    const jwt = `${unsignedToken}.${signature.toString('base64url')}`;

    const hasKeys = Boolean(subscription.keys?.p256dh && subscription.keys?.auth);
    const bodyBuffer = hasKeys
      ? encryptWebPushPayload(payloadString, subscription.keys!.p256dh!, subscription.keys!.auth!)
      : null;

    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        TTL: '86400',
        Urgency: 'high',
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        ...(bodyBuffer
          ? {
              'Content-Encoding': 'aes128gcm',
              'Content-Type': 'application/octet-stream',
              'Content-Length': String(bodyBuffer.length),
            }
          : {
              'Content-Length': '0',
            }),
      },
      body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
    });

    return res.ok || res.status === 201;
  } catch (err) {
    console.warn('Falha ao enviar push para endpoint:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, link, id, is_urgent, targetUserId } = body;

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: 'Título e mensagem são obrigatórios.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '').trim()
      : null;

    let supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
        ...(bearerToken
          ? {
              global: {
                headers: {
                  Authorization: `Bearer ${bearerToken}`,
                },
              },
            }
          : {}),
      }
    );

    const {
      data: { user },
    } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    // Se houver SUPABASE_SERVICE_ROLE_KEY configurada, usa para buscar todas as assinaturas sem restrição de RLS
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) as any;
    }

    // Busca os perfis com assinaturas Web Push registradas
    let query = supabase
      .from('profiles')
      .select('id, theme_preference')
      .eq('is_active', true);

    if (targetUserId) {
      query = query.eq('id', targetUserId);
    }

    const [{ data: profiles }, { data: pushGuideRow }] = await Promise.all([
      query,
      supabase
        .from('donation_guides')
        .select('content')
        .eq('title', '[PUSH_SUBS]')
        .maybeSingle(),
    ]);

    const pushPayload = JSON.stringify({
      id: id || `oba-${Date.now()}`,
      title: String(title).slice(0, 140),
      body: String(message).slice(0, 400),
      url: link || '/doador',
      urgent: Boolean(is_urgent),
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });

    const endpointMap = new Map<string, any>();

    if (profiles) {
      for (const prof of profiles) {
        if (prof.theme_preference && prof.theme_preference.startsWith('{')) {
          try {
            const parsed = JSON.parse(prof.theme_preference);
            if (Array.isArray(parsed.push_subscriptions)) {
              for (const sub of parsed.push_subscriptions) {
                if (sub && sub.endpoint) {
                  endpointMap.set(sub.endpoint, sub);
                }
              }
            }
          } catch {}
        }
      }
    }

    if (pushGuideRow?.content && pushGuideRow.content.startsWith('{')) {
      try {
        const parsedGuide = JSON.parse(pushGuideRow.content);
        for (const [uid, subs] of Object.entries(parsedGuide)) {
          if (targetUserId && uid !== targetUserId) continue;
          if (Array.isArray(subs)) {
            for (const sub of subs) {
              if (sub && sub.endpoint) {
                endpointMap.set(sub.endpoint, sub);
              }
            }
          }
        }
      } catch {}
    }

    const subscriptionsToSend = Array.from(endpointMap.values());

    let sentCount = 0;
    await Promise.all(
      subscriptionsToSend.map(async (sub) => {
        const ok = await sendWebPushNotification(sub, pushPayload);
        if (ok) sentCount++;
      })
    );

    return NextResponse.json({ ok: true, sent: sentCount, totalDevices: subscriptionsToSend.length });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Erro interno no disparo Push.' },
      { status: 500 }
    );
  }
}
