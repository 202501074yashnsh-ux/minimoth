import { useState } from 'react';

function AuthPage({ setUser, API_BASE }) {
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function requestOtp() {
    const trimmedPhone = phone.trim();
    if (!/^\+[1-9]\d{9,14}$/.test(trimmedPhone)) {
      setError('Please use a valid phone number in E.164 format (e.g. +919876543210).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to send OTP.');
      }

      setOtpSent(true);
      setDemoCode(data.demoCode || '');
      if (data.demoCode) {
        setOtp(data.demoCode);
      }
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    const trimmedPhone = phone.trim();
    const trimmedOtp = otp.trim();

    if (!/^\+[1-9]\d{9,14}$/.test(trimmedPhone)) {
      setError('Phone number is invalid.');
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError('OTP must be a 6-digit number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, otp: trimmedOtp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      setUser(data.user);
    } catch (verifyError) {
      setError(verifyError.message || 'Could not verify OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell auth-shell">
      <div className="panel auth-panel">
        <div className="section-header">
          <span className="eyebrow">Welcome</span>
          <h1>Recipe Manager</h1>
        </div>

        <label>
          Phone number
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+919876543210"
          />
        </label>

        <button className="secondary" onClick={requestOtp} disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>

        {otpSent && (
          <div className="inline-callout">
            <p>OTP sent successfully.</p>
            {demoCode ? (
              <small>Demo code auto-filled: <strong>{demoCode}</strong></small>
            ) : (
              <small>Check your WhatsApp / SMS for the verification code.</small>
            )}
          </div>
        )}

        <label>
          OTP code
          <input
            type="text"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            maxLength={6}
            placeholder="123456"
          />
        </label>

        <button onClick={verifyOtp} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify and login'}
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}

export default AuthPage;
