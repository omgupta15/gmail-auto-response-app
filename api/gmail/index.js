import axios from "axios";
import { google } from "googleapis";

const getMails = (gmail, query) => {
  return new Promise((resolve, reject) => {
    gmail.users.messages.list({ userId: "me", q: query }, (err, response) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(response);
    });
  });
};

const getMailsOnThread = (gmail, threadId) => {
  return new Promise((resolve, reject) => {
    gmail.users.threads.get({ userId: "me", id: threadId }, (err, response) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(response);
    });
  });
};

const formatDate = (date) => {
  return date.toISOString().slice(0, 10).replace(/-/g, "/");
};

const prettyPrint = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

const getFieldValue = (mail, fieldName) => {
  const field = mail.payload.headers.find((i) => i.name === fieldName); //.value;
  console.log(field);
  return field?.value || "";
};

const hasUserReplied = (mail, email) => {
  return getFieldValue(mail, "From").includes(email);
};

const getGmailAPI = (accessToken) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });
  return gmail;
};

const getMailsList = async (gmail, afterTime) => {
  const PST_OFFSET = 8 * 60 * 60 * 1000;
  const TIME_OFFSET = afterTime.getTimezoneOffset() * 60 * 1000;

  const pstTime = afterTime.getTime() + TIME_OFFSET + PST_OFFSET;
  // console.log("PST Time:", pstTime);

  const beforeTime = new Date();
  beforeTime.setTime(beforeTime.getTime() + 24 * 60 * 60 * 1000);
  const query = `in:inbox after:${formatDate(afterTime)} before:${formatDate(
    beforeTime
  )}`;
  const mailsData = await getMails(gmail, query);
  // prettyPrint(mailsData);

  const mails = mailsData.data.messages;
  return mails;
};

const generateMessageObjectsOnThreadsWithoutReply = async (
  gmail,
  threadIds,
  email,
  messageToReply
) => {
  const messageObjects = [];

  for (let threadId of threadIds) {
    const response = await getMailsOnThread(gmail, threadId);
    console.log(response);

    const mailsOnThread = response.data.messages;
    const userMailsOnThread = mailsOnThread.filter((mail) =>
      hasUserReplied(mail, email)
    );

    if (userMailsOnThread.length !== 0) continue;

    const headers = {
      From: email,
      To: getFieldValue(mailsOnThread[mailsOnThread.length - 1], "From"),
      Subject: getFieldValue(
        mailsOnThread[mailsOnThread.length - 1],
        "Subject"
      ),
      "In-Reply-To": getFieldValue(
        mailsOnThread[mailsOnThread.length - 1],
        "Message-ID"
      ),
      // References: getFieldValue(
      //   mailsOnThread[mailsOnThread.length - 1],
      //   "References"
      // ).value,
      "Content-Type": "text/html; charset=UTF-8",
    };
    console.log("NEW HEADERS:", headers);

    let rawMessage =
      `From: ${headers.From}\r\n` +
      `To: ${headers.To}\r\n` +
      `Subject: ${headers.Subject}\r\n` +
      `In-Reply-To: ${headers["In-Reply-To"]}\r\n` +
      // `References: ${headers.References}\r\n` +
      `Content-Type: ${headers["Content-Type"]}\r\n` +
      "\r\n" +
      `${messageToReply}`;

    const messageObject = { raw: rawMessage, threadId };
    messageObjects.push(messageObject);
  }

  return messageObjects;
};

const createLabelIfNotExists = async (gmail, label) => {
  let response = await gmail.users.labels.list({ userId: "me" });

  const doesLabelExist = response.data.labels.some((i) => i.name === label);
  if (doesLabelExist) {
    console.log(`Label ${label} already exists.`);
    return;
  }

  response = await gmail.users.labels.create({
    userId: "me",
    resource: {
      name: label,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  console.log(`Created label ${label} successfully.`);
  console.log(response);
};

const getLabelId = async (gmail, label) => {
  const res = await gmail.users.labels.list({ userId: "me" });
  const labels = res.data.labels;
  console.log("Labels:", labels);

  const result = labels.find((i) => i.name === label);

  if (!result) {
    console.log(`Label ${label} not found.`);
    return null;
  }

  console.log(`Label ${label} found with id: ${result.id}`);
  return result.id;
};

const addLabelIdToThread = async (gmail, threadId, labelId) => {
  const response = await gmail.users.threads.modify({
    id: threadId,
    userId: "me",
    requestBody: {
      addLabelIds: [labelId],
    },
  });
  console.log(response);
  return response;
};

const sendMessageWithLabel = async (
  gmail,
  messageObject,
  threadId,
  labelId
) => {
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: Buffer.from(messageObject.raw).toString("base64"),
      threadId,
      labelIds: [labelId],
    },
  });
  console.log(response);

  await addLabelIdToThread(gmail, threadId, labelId);

  return response.data;
};

export default {
  getGmailAPI,
  getMailsList,
  generateMessageObjectsOnThreadsWithoutReply,
  createLabelIfNotExists,
  getLabelId,
  sendMessageWithLabel,
};
