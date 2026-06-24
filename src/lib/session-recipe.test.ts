import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STATE_BY_LOCALE } from "../types";
import {
  applySessionRecipeToOverlayState,
  formatSessionRecipeMarkdown,
  parseSessionRecipe,
  stateToSessionRecipe,
} from "./session-recipe";

test("parseSessionRecipe reads a markdown recipe", () => {
  const recipe = parseSessionRecipe(
    `
# AI Agent 长任务实践

## Goal
理解 long-running agents，并应用到 Vibe Studio。

## Tasks
- 阅读 Addy Osmani 的文章
- 提炼 Agent 工作流原则
- 更新直播工具设计

## Stack
Next.js, OBS, GPT-5.5 Pro, Codex

## Social
Bilibili: Aklman
Website: aklman.com
QQ Group: 205359827
`,
    "zh",
  );

  assert.equal(recipe.title, "AI Agent 长任务实践");
  assert.equal(recipe.goal, "理解 long-running agents，并应用到 Vibe Studio。");
  assert.deepEqual(recipe.tasks, [
    "阅读 Addy Osmani 的文章",
    "提炼 Agent 工作流原则",
    "更新直播工具设计",
  ]);
  assert.deepEqual(recipe.stackItems, [
    "Next.js",
    "OBS",
    "GPT-5.5 Pro",
    "Codex",
  ]);
  assert.deepEqual(recipe.socials, [
    { kind: "bilibili", label: "Bilibili", value: "Aklman" },
    { kind: "blog", label: "Website", value: "aklman.com" },
    { kind: "qq", label: "QQ Group", value: "205359827" },
  ]);
});

test("parseSessionRecipe preserves punctuation inside markdown task bullets", () => {
  const recipe = parseSessionRecipe(
    `
# 个人设计语言

## Tasks
- 提炼颜色、字体、布局和组件规则
- 生成 HTML/PPT/报告/笔记示例
`,
    "zh",
  );

  assert.deepEqual(recipe.tasks, [
    "提炼颜色、字体、布局和组件规则",
    "生成 HTML/PPT/报告/笔记示例",
  ]);
});

test("parseSessionRecipe extracts useful fields from a Chinese one-line brief", () => {
  const recipe = parseSessionRecipe(
    "今天直播学习 Addy Osmani 的 long-running agents 文章。任务是：阅读文章、总结关键观点、设计到 Vibe Studio、最后做复盘。技术栈显示 Next.js、OBS、GPT-5.5 Pro、Codex。",
    "zh",
  );

  assert.equal(recipe.title, "学习 Addy Osmani 的 long-running agents 文章");
  assert.deepEqual(recipe.tasks, [
    "阅读文章",
    "总结关键观点",
    "设计到 Vibe Studio",
    "最后做复盘",
  ]);
  assert.deepEqual(recipe.stackItems, [
    "Next.js",
    "OBS",
    "GPT-5.5 Pro",
    "Codex",
  ]);
});

test("applySessionRecipeToOverlayState updates live data and shared cover copy", () => {
  const base = DEFAULT_STATE_BY_LOCALE.zh;
  const next = applySessionRecipeToOverlayState(
    base,
    {
      title: "AI Agent 长任务实践",
      goal: "理解 long-running agents",
      tasks: ["阅读文章", "提炼原则", "更新工具"],
      stackItems: ["Next.js", "OBS", "Codex"],
      socials: [
        { kind: "bilibili", label: "B站", value: "Aklman" },
        { kind: "blog", label: "个人网站", value: "aklman.com" },
      ],
    },
    "zh",
  );

  assert.equal(next.cover.title, "AI Agent 长任务实践");
  assert.equal(next.cover.todayTopic, "理解 long-running agents");
  assert.equal(next.sidebar.activeSection, 0);
  assert.equal(next.sidebar.sections[0]?.title, "今日目标");
  assert.deepEqual(next.sidebar.sections[0]?.bullets, [
    "阅读文章",
    "提炼原则",
    "更新工具",
  ]);
  assert.deepEqual(next.sidebar.sectionsDone[0], [false, false, false]);
  assert.deepEqual(next.stack.items.map((item) => item.label), ["Next.js", "OBS", "Codex"]);
  assert.equal(next.stack.items[0].iconKey, "nextdotjs");
  assert.equal(next.stack.items[1].iconKey, "obs");
  assert.deepEqual(next.cover.socials.slice(0, 2), [
    {
      visible: true,
      iconKey: "bilibili",
      iconMode: "mono",
      label: "B站",
      value: "Aklman",
      customColor: "",
    },
    {
      visible: true,
      iconKey: "website",
      iconMode: "mono",
      label: "个人网站",
      value: "aklman.com",
      customColor: "",
    },
  ]);
});

test("stateToSessionRecipe and formatSessionRecipeMarkdown export reusable markdown", () => {
  const state = applySessionRecipeToOverlayState(
    DEFAULT_STATE_BY_LOCALE.en,
    {
      title: "Long-running Agents",
      goal: "Turn agent reading notes into stream tasks",
      tasks: ["Read article", "Extract patterns"],
      stackItems: ["Next.js", "OBS"],
      socials: [{ kind: "youtube", label: "YouTube", value: "@aklman2018" }],
    },
    "en",
  );

  const markdown = formatSessionRecipeMarkdown(stateToSessionRecipe(state));

  assert.match(markdown, /^# Long-running Agents/);
  assert.match(markdown, /## Goal\nTurn agent reading notes into stream tasks/);
  assert.match(markdown, /## Tasks\n- Read article\n- Extract patterns/);
  assert.match(markdown, /## Stack\nNext\.js, OBS/);
  assert.match(markdown, /## Social\nYouTube: @aklman2018/);
});
