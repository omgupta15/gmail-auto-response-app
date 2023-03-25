import { google } from "googleapis";
import axios from "axios";

const scopes = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
  "https://www.googleapis.com/auth/gmail.addons.current.message.action",
  "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
  "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.insert",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.settings.sharing",
];

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URL
  );
};

const getUserEmail = async (accessToken) => {
  const response = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`
  );
  return response.data.email;
};

const getAuthUrl = () => {
  const oauth2Client = getOAuth2Client();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "select_account",
  });
  return url;
};

const verifyCode = async (code) => {
  const url = "https://oauth2.googleapis.com/token";
  const payload = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    grant_type: "authorization_code",
  };
  try {
    const response = await axios.post(url, payload);
    console.log(response);
    const data = response.data;
    console.log(data);

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = data;
    const tokenExpiresOn = new Date();
    tokenExpiresOn.setTime(tokenExpiresOn.getTime() + expiresIn * 1000);

    const email = await getUserEmail(accessToken);

    return { success: true, accessToken, refreshToken, tokenExpiresOn, email };
  } catch (err) {
    console.log("Error while verifying code:", err);
    return { success: false };
  }
};

const refreshAccessToken = async (accessToken, refreshToken) => {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (oauth2Client.isTokenExpiring()) {
    const response = await oauth2Client.refreshAccessToken();
    console.log("Token refreshed!");
    console.log("response:", response);

    return {
      success: true,
      accessToken: response.credentials.access_token,
      refreshToken: response.credentials.refresh_token,
    };
  } else {
    console.log("Token not expiring!");
    return { success: false };
  }
};

export default { getAuthUrl, verifyCode, refreshAccessToken };
