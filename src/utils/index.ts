import { testUsers } from "@config/constants";
import axios from "axios";
import { networkInterfaces } from "os";

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except '+'
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // If number doesn't start with '+', add it
  if (!cleaned.startsWith("+")) {
    // Assuming default country code is India (+91)
    // You can make this configurable based on your needs
    return cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned}`;
  }

  return cleaned;
};

/**
 * Validates if the phone number is in correct format
 * Valid formats: +919876543210, 919876543210, 9876543210
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // After formatting, should match E.164 format for Indian numbers
  const formatted = formatPhoneNumber(phoneNumber);
  return /^\+91[6-9]\d{9}$/.test(formatted);
};
export const convertToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const getTestUser = (phoneNumber: string) => {
  // Format the input phone number to ensure consistent comparison
  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

  // Find the test user whose formatted phone number matches the input
  const testUser = testUsers.find(
    (user) => formatPhoneNumber(user.phoneNumber) === formattedPhoneNumber
  );

  if (!testUser) {
    return null;
  }

  return testUser;
};

export const getPublicIp = async () => {
  try {
    const res = await axios.get("https://api.ipify.org?format=json");
    console.log("##############\nPublic IP:", res.data.ip, "\n##############");
  } catch (err) {
    console.error(err);
  }
};
export const getServerIp = (): string => {
  const nets = networkInterfaces();
  let serverIp = "";

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (!net.internal && net.family === "IPv4") {
        serverIp = net.address;
        break;
      }
    }
    if (serverIp) break;
  }

  return serverIp || "127.0.0.1";
};
const isValidIp = (ip: string): boolean => {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

export const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (isValidIp(firstIp)) return firstIp;
  }

  const ip =
    (req.headers["x-real-ip"] as string) ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    "0.0.0.0";

  return isValidIp(ip) ? ip : "0.0.0.0";
};
