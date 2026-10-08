const { MiniMoth } = require('@minimoth/sdk-node');

function isDemoKey(apiKey) {
  return !apiKey || apiKey === 'demo_key';
}

function logMinimothFailure(context, error) {
  console.error('[Minimoth] Request failed', {
    context,
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
    cause: error?.cause,
    stack: error?.stack,
  });
}

function createClient() {
  const apiKey = String(process.env.MINIMOTH_API_KEY || '').trim();
  if (isDemoKey(apiKey)) {
    console.log('[Minimoth] API key configured:', false);
    return null;
  }

  console.log('[Minimoth] API key configured:', true);
  return new MiniMoth({ apiKey });
}

async function sendOtpViaMinimoth(phone, code) {
  const apiKey = String(process.env.MINIMOTH_API_KEY || '').trim();
  if (isDemoKey(apiKey)) {
    return {
      mode: 'demo',
      message: 'Minimoth API key missing or demo_key; using demo OTP fallback.',
      code,
    };
  }

  const mm = createClient();
  if (!mm) {
    return {
      mode: 'demo',
      message: 'Minimoth API key missing or demo_key; using demo OTP fallback.',
      code,
    };
  }

  try {
    const result = await mm.otp.send({ phone });
    return {
      mode: 'real',
      message: 'OTP sent via Minimoth.',
      result,
      code,
    };
  } catch (error) {
    logMinimothFailure(`mm.otp.send({ phone: '${phone}' })`, error);
    console.warn('[Minimoth] Falling back to demo OTP because the real request failed.');
    return {
      mode: 'demo',
      message: 'Minimoth request failed; demo OTP fallback used.',
      code,
      cause: error?.cause,
      codeName: error?.code ?? null,
      statusCode: error?.statusCode ?? null,
    };
  }
}

async function verifyOtpViaMinimoth(phone, code) {
  const apiKey = String(process.env.MINIMOTH_API_KEY || '').trim();
  if (isDemoKey(apiKey)) {
    return { mode: 'demo', valid: true };
  }

  const mm = createClient();
  if (!mm) {
    return { mode: 'demo', valid: true };
  }

  try {
    const result = await mm.otp.verify({ phone, otp: String(code) });
    return {
      mode: 'real',
      valid: Boolean(result?.valid),
      result,
    };
  } catch (error) {
    logMinimothFailure(`mm.otp.verify({ phone: '${phone}', otp: '${code}' })`, error);
    return { mode: 'demo', valid: true, fallback: true };
  }
}

module.exports = {
  sendOtpViaMinimoth,
  verifyOtpViaMinimoth,
};
