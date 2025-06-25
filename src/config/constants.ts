export const mongoDbUri = process.env.MONGO_URI;
export const mongoDbName = process.env.MONGO_DB_NAME;
export const cookieExpires = process.env.COOKIE_EXPIRES;
export const jwtExpires = process.env.JWT_EXPIRES;
export const jwtSecret = process.env.JWT_SECRET;
export const port = process.env.PORT;
export const nodeEnv = process.env.NODE_ENV;

export const POLLING = process.env.POLLING === "true" || false;
export const FRONTEND_URL = process.env.FRONTEND_URL || "https://unifitz.in";
export const LUCKY_SPORTS_JWT = process.env.LUCKY_SPORTS_JWT;

export const s3Endpoint = process.env.S3_ENDPOINT;
export const s3BucketName = process.env.S3_BUCKET_NAME;
export const s3AwsKeyId = process.env.S3_AWS_KEY_ID;
export const s3AceessKey = process.env.S3_ACCESS_KEY;

// FUNDIST
export const fundistConfig = {
  apiKey: process.env.FUNDIST_API_KEY,
  apiPassword: process.env.FUNDIST_API_PASSWORD,
  apiEndUrl: process.env.FUNDIST_API_END_URL,
  hmacSecret: process.env.FUNDIST_HMAC_SECRET,
  // hmacAlgorithm: process.env.FUNDIST_HMAC_ALGORITHM,
};

// Two Factor Authentication
export const twoFactorConfig = {
  URL: process.env.TWO_FACTOR_URL || "https://2factor.in/API/V1",
  API_KEY: process.env.TWO_FACTOR_API_KEY || "",
  TEMPLATE_NAME: process.env.TWO_FACTOR_TEMPLATE || "",
};

export const emailConfig = {
  resendApiKey: process.env.RESEND_API_KEY || "your-resend-api-key",
  fromAddress: process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev",
};

export const bet365Api = {
  useMockData: process.env.USE_MOCK_DATA === "true" || false,
  baseUrl: process.env.BET365_API_URL || "https://api.bet365.com",
  baseUrlV3: process.env.BET365_API_URL_V3 || "https://api.bet365.com",
  apiKey: process.env.BET365_API_KEY,
};

export const luckySportsConfig = {
  email: process.env.LS_EMAIL,
  password: process.env.LS_PASSWORD,
  apiKey: process.env.LS_API_KEY,
};

// HZPays
export const hzPaysConfig = {
  merchantId: process.env.HZPAYS_MERCHANT_ID || "5981009",
  apiKey: process.env.HZPAYS_API_KEY || "",
  apiUrl: process.env.HZPAYS_API_URL || "https://hzpays.com/api/v1/payment/",
  notifyUrl:
    process.env.HZPAYS_NOTIFY_URL ||
    `https://api.unifitz.in/api/v1/payments/hzpays/callback`,
  payoutNotifyUrl:
    process.env.HZPAYS_PAYOUT_NOTIFY_URL ||
    `https://api.unifitz.in/api/v1/payments/hzpays/payout-callback`,
  redirectUrl:
    process.env.HZPAYS_REDIRECT_URL || `${FRONTEND_URL}/deposit/success`,
};

// BSD Pay
export const bsdPayConfig = {
  accessKey: process.env.BSDPAY_ACCESS_KEY || "",
  accessSecret: process.env.BSDPAY_ACCESS_SECRET || "",
  apiUrl: process.env.BSDPAY_API_URL || "https://api.bsdpaymc.com",
  // notifyUrl: process.env.BSDPAY_NOTIFY_URL || `https://api.unifitz.in/api/v1/payments/bsdpay/callback`,
  payoutNotifyUrl:
    process.env.BSDPAY_PAYOUT_NOTIFY_URL ||
    `https://api.unifitz.in/api/v1/payments/bsdpay/callback`,
};

export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const testUsers = [
  {
    phoneVerified: true,
    referralCode: null,
    _id: "67ecf62068f068e484df8b86",
    email: "testinguser1@yopmail.com",
    role: "USER",
    phoneNumber: "+919999999999",
    emailVerified: true,
    signupComplete: true,
    active: true,
    name: "test user",
    luckySportUserId: null,
    luckySportPlayerId: null,
    fundist: true,
    createdAt: "2025-04-02T08:32:32.169Z",
    updatedAt: "2025-05-25T23:37:01.649Z",
    __v: 0,
    wallet: {
      _id: "67ecf62068f068e484df8b88",
      balance: 500,
      holdBalance: 0,
    },
    otp: 9999
  },
];
