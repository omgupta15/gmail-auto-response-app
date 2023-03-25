import db from "./mockdb.js";
import oauth2 from "./api/oauth2/index.js";
import gmail from "./api/gmail/index.js";

const sendUserReplies = async (user) => {
  const refreshResponse = await oauth2.refreshAccessToken(
    user.tokens.accessToken,
    user.tokens.refreshToken
  );
  if (refreshResponse.success) {
    let userIndex = db.users.findIndex((i) => i === user);
    db.users[userIndex].accessToken = refreshResponse.accessToken;
    db.users[userIndex].refreshToken = refreshResponse.refreshToken;
    db.save();
    user = db.users[userIndex];
  }

  const gmailAPI = gmail.getGmailAPI(user.tokens.accessToken);

  await gmail.createLabelIfNotExists(gmailAPI, process.env.LABEL_NAME);
  const labelId = await gmail.getLabelId(gmailAPI, process.env.LABEL_NAME);

  const mails = await gmail.getMailsList(
    gmailAPI,
    new Date(user.lastCheckedOn)
  );
  console.log(`Got ${mails.length} mails.`);

  const threadIds = Array.from(new Set(mails.map((mail) => mail.threadId)));
  console.log(`Got ${threadIds.length} threads.`);

  const messageObjects =
    await gmail.generateMessageObjectsOnThreadsWithoutReply(
      gmailAPI,
      threadIds,
      user.tokens.email,
      process.env.MESSAGE_TO_REPLY
    );
  console.log(`Got ${messageObjects.length} messages to reply.`);

  for (let message of messageObjects)
    await gmail.sendMessageWithLabel(
      gmailAPI,
      message,
      message.threadId,
      labelId
    );
};

const run = async () => {
  for (let user of db.users) await sendUserReplies(user);

  const seconds = Math.round(Math.random() * 75 + 45);
  console.log(`Waiting for ${seconds} seconds...`);
  setTimeout(run, seconds * 1000);
};

run()
  .then(() => {})
  .catch((err) => console.log(err));
