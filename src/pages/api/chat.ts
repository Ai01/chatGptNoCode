// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type ChatGptMessage = {
  role: roles;
  content: string;
};

type Data = {
  message: ChatGptMessage[];
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  axios({
    method: "post",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      Authorization:
        "Bearer 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",
      "Content-Type": "application/json",
    },
    data: {
      model: "gpt-3.5-turbo",
      messages: req?.body?.messages,
    },
  }).then((resFromChatGpt) => {
    const message = resFromChatGpt?.data?.choices[0]?.message
    console.log("chat gpt response", message);

    res.status(200).json({message});
  });
}
