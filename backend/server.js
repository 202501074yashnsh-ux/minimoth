require('dotenv').config();
const express = require('express');
const { initDb, upsertUser, saveOtp, getLatestOtp, deleteOtps, listRecipesByUser, createRecipe, deleteRecipe } = require('./src/database');
const { sendOtpViaMinimoth, verifyOtpViaMinimoth } = require('./src/minimoth');

console.log('[Config] MINIMOTH_BASE_URL loaded:', Boolean(process.env.MINIMOTH_BASE_URL));
console.log('[Config] MINIMOTH_API_KEY present:', Boolean(process.env.MINIMOTH_API_KEY));

const app = express();
app.use(express.json());

const port = Number(process.env.PORT || 3001);
const PHONE_REGEX = /^\+[1-9]\d{9,14}$/;

function validatePhone(phone) {
  if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
    throw new Error('Please enter a valid phone number in E.164 format, for example +1234567890.');
  }
}

function requireUserId(req) {
  const userId = Number(req.headers['x-user-id']);
  if (!userId || Number.isNaN(userId)) {
    throw new Error('Missing or invalid user id.');
  }
  return userId;
}



app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    validatePhone(phone);

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await saveOtp(phone, otpCode, expiresAt);

    const minimothResponse = await sendOtpViaMinimoth(phone, otpCode);

    const responseMessage =
      minimothResponse.mode === 'demo'
        ? `Demo OTP sent. ${minimothResponse.message}`
        : 'OTP sent via Minimoth.';

    res.json({
      message: responseMessage,
      mode: minimothResponse.mode,
      demoCode: minimothResponse.mode === 'demo' ? otpCode : undefined,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to send OTP.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const otpCode = String(req.body.otp || '').trim();

    validatePhone(phone);

    if (!otpCode || otpCode.length !== 6) {
      throw new Error('OTP must be a 6-digit code.');
    }

    const otpRecord = await getLatestOtp(phone);
    if (!otpRecord) {
      throw new Error('No OTP found for this phone number.');
    }

    const isExpired = new Date() > new Date(otpRecord.expires_at);
    if (isExpired) {
      throw new Error('This OTP has expired. Please request a new one.');
    }

    const apiKey = String(process.env.MINIMOTH_API_KEY || '').trim();
    const realApiActive = Boolean(apiKey) && apiKey !== 'demo_key';

    if (realApiActive) {
      const verificationResult = await verifyOtpViaMinimoth(phone, otpCode);
      if (verificationResult.valid) {
        const user = await upsertUser(phone);
        await deleteOtps(phone);

        return res.json({
          message: 'Login successful.',
          user: { id: user.id, phone: user.phone },
        });
      }

      if (otpRecord.code === otpCode) {
        const user = await upsertUser(phone);
        await deleteOtps(phone);

        return res.json({
          message: 'Login successful.',
          user: { id: user.id, phone: user.phone },
        });
      }

      throw new Error('The OTP you entered is invalid.');
    }

    const matches = otpRecord.code === otpCode;
    if (!matches) {
      throw new Error('The OTP you entered is invalid.');
    }

    const user = await upsertUser(phone);
    await deleteOtps(phone);

    res.json({
      message: 'Login successful.',
      user: { id: user.id, phone: user.phone },
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to verify OTP.' });
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const userId = requireUserId(req);
    const recipes = await listRecipesByUser(userId);
    res.json({ recipes });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to fetch recipes.' });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const userId = requireUserId(req);
    const title = String(req.body.title || '').trim();
    const ingredients = String(req.body.ingredients || '').trim();
    const instructions = String(req.body.instructions || '').trim();

    if (!title) {
      throw new Error('Recipe title is required.');
    }
    if (!ingredients) {
      throw new Error('Ingredients are required.');
    }
    if (!instructions) {
      throw new Error('Instructions are required.');
    }

    const recipe = await createRecipe({ userId, title, ingredients, instructions });
    res.status(201).json({ message: 'Recipe created.', recipe });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to create recipe.' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const userId = requireUserId(req);
    const recipeId = Number(req.params.id);

    if (!recipeId || Number.isNaN(recipeId)) {
      throw new Error('Recipe id is invalid.');
    }

    const deleted = await deleteRecipe({ userId, recipeId });
    if (!deleted) {
      throw new Error('Recipe not found or it does not belong to this user.');
    }

    res.json({ message: 'Recipe deleted.' });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to delete recipe.' });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

async function startServer() {
  await initDb();
  app.listen(port, () => {
    console.log(`Recipe Manager API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
