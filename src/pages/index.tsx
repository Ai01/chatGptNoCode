"use client";
import { Input } from "antd";
import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import axios from "axios";
import styles from "@/styles/Home.module.css";
import HumanIcon from "@/../public/human.png";
import RobotIcon from "@/../public/robot.png";
import { url } from "inspector";
import DomSerializer from "dom-serializer";

const inter = Inter({ subsets: ["latin"] });
const { Search } = Input;

type ComponentProps = {
  children: ComponentMeta[];
};

type ComponentMeta = {
  name: string;
  props: ComponentProps;
};

enum roles {
  user = "user",
  assistant = "assistant",
}

type ChatGptMessage = {
  role: roles;
  content: string;
};

type ReactSchemaRenderProps = {
  schema: ComponentMeta[];
};

const MockComponentJson: ComponentMeta[] = {
  tag: "html",
  props: {},
  children: [
    {
      tag: "body",
      props: {},
      children: [
        {
          tag: "button",
          props: { class: "ant-btn ant-btn-primary", type: "button" },
          children: ["Antd Button"],
        },
      ],
    },
  ],
};

const MockChatGptMessages: ChatGptMessage[] = [
  {
    role: "system",
    content:
      "你是一个ast翻译程序，你可以将人类自然语言描述的指令翻译成对应的html ast",
  },
  {
    role: "system",
    content: "javascript内容放到script标签中，css放到style标签中",
  },
  {
    role: "system",
    content:
      "你只需要将翻译好的内容直接输出为JSON格式，而不需要对其进行任何的解释。JSON格式中用tag代表标签名 , props代表属性对象",
  },
  {
    role: "system",
    content:
      "如果你不明白我说的话，或不确定如何将我所说的指令转换为计算机命令行，请直接输出 7 个字母，UNKNOWN",
  },
];

const ReactSchemaRender = (props: ReactSchemaRenderProps) => {
  const { schema } = props;

  const convertAstToHtmlString = (ast) => {
    if (Array.isArray(ast)) {
      return ast.map((i) => convertAstToHtmlString(i)).join("");
    }
    const { tag, children, text, props } = ast;
    const propsStr = props
      ? Object.keys(props)
          .map((i) => `${i}="${props[i]}"`)
          .join("")
      : "";
    if (Array.isArray(children)) {
      return `<${tag} ${propsStr} >${convertAstToHtmlString(
        children
      )}</${tag}>`;
    }
    if (tag) {
      if (text) return `<${tag} ${propsStr} >${text}</${tag}>`;
      return `<${tag} ${propsStr} ></${tag}>`;
    }
    if (!tag) {
      return String(ast);
    }
  };

  console.log("test", schema, convertAstToHtmlString(schema));
  return (
    <div
      dangerouslySetInnerHTML={{ __html: convertAstToHtmlString(schema) }}
    ></div>
  );
};

const getNewestAst = (messages) => {
  let res;
  for (let i = messages.length - 1; i > 0; i--) {
    if (messages[i]?.role === roles.assistant) {
      res = messages[i]?.content ? JSON.parse(messages[i]?.content) : [];
      break;
    }
  }
  return res;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatGptMessage>(MockChatGptMessages);

  return (
    <>
      <Head>
        <title>NoCode</title>
        <meta name="description" content="natural language no code" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.leftMessage}>
              {messages.map((i) => {
                const { content, role } = i;
                if (role === roles.assistant) {
                  return (
                    <div className={styles.assistantContent}>
                      <Image
                        className={styles.headIcon}
                        src={RobotIcon}
                      ></Image>
                      <code className={styles.language}>
                        {JSON.stringify(JSON.parse(content), null, 2)}
                      </code>
                    </div>
                  );
                }
                if (role === roles.user) {
                  return (
                    <div className={styles.userContent}>
                      <Image
                        className={styles.headIcon}
                        src={HumanIcon}
                      ></Image>
                      <div>{content}</div>
                    </div>
                  );
                }
              })}
            </div>
            <Search
              className={styles.searchButton}
              placeholder="请输入"
              enterButton="确认"
              size="large"
              onSearch={(value) => {
                const nextHumanMessages = messages.concat([
                  { role: "user", content: value },
                ]);
                setMessages(nextHumanMessages);

                axios({
                  method: "post",
                  url: "/api/chat",
                  data: {
                    messages: nextHumanMessages,
                  },
                }).then((res) => {
                  const nextMessage = res?.data?.message;
                  const nextRobotMessages = nextHumanMessages.concat([
                    nextMessage,
                  ]);

                  setMessages(nextRobotMessages);
                });
              }}
            />
          </div>
          <div className={styles.right}>
            <ReactSchemaRender
              schema={getNewestAst(messages) || MockComponentJson}
            />
          </div>
        </div>
      </main>
    </>
  );
}
