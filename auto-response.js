import db from "./mockdb.js";
import oauth2 from "./api/oauth2/index.js";
import gmail from "./api/gmail/index.js";

const user = {
  tokens: {
    success: true,
    accessToken:
      "ya29.a0Ael9sCNPZC4Tq-ExkkdoaNoLeEjMJrqx9bxd9Ah9U68T6lJVimRWuK_fkl0k_GehGwMDGQdDm2XmEAV2ajXAAxszo02nOQxuljnTKqLu33NI2ZdJjpmJ4EnFwpl4zQvFoW1KS7l0PlCvcjl5NC3M2L4FksTJaCgYKAdESARASFQF4udJhUA-rRSEouzu0tVU05PlOqg0163",
    refreshToken:
      "1//0gUe4Vckg1_xsCgYIARAAGBASNwF-L9Ir_lifZ_j7qduUoIIAVdpzGhu3FQJsHIAavxbgv3J5Hc-T-N3QjqaoMq9-Q5oyzloHpOU",
    tokenExpiresOn: "2023-03-25T07:32:56.106Z",
    email: "email.auto.response.listed@gmail.com",
  },
  addedOn: "2023-03-25T06:32:57.106Z",
  lastCheckedOn: "2023-03-25T06:32:57.106Z",
};

const sendUserReplies = async (user) => {
  await oauth2.refreshAccessToken(
    user.tokens.accessToken,
    user.tokens.refreshToken
  );

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
