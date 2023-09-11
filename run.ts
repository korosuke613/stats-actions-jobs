import { Octokit } from "npm:@octokit/core";
import * as ss from "npm:simple-statistics";

const OWNER = Deno.args[0];
const REPO = Deno.args[1];
const WORKFLOW_ID = Deno.args[2];
const START_DATE = Deno.args[3];
const END_DATE = Deno.args[4];
const BRANCH = Deno.args[5] ? Deno.args[5] : "main";

const convertDateToJapanese = (datetime: string) => {
  return datetime.replace(".000", "").replace("Z", "+09:00");
};

const startTime = convertDateToJapanese(new Date(START_DATE).toISOString());
const endTime = convertDateToJapanese(
  new Date(END_DATE).toISOString().replace(".000", "").replace("Z", "+09:00"),
);

const GITHUB_API_TOKEN = Deno.env.get("GITHUB_API_TOKEN");

const octokit = new Octokit({
  auth: GITHUB_API_TOKEN,
});

const res = await octokit.request(
  "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
  {
    owner: OWNER,
    repo: REPO,
    workflow_id: WORKFLOW_ID,
    status: "completed",
    created: `${startTime}..${endTime}`,
    branch: BRANCH,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  },
);

const elapsedTimes = res.data.workflow_runs.filter((workflowRun) =>
  workflowRun.conclusion === "success"
).map((workflowRun) => {
  const { id, created_at, updated_at } = workflowRun;
  const elapsed_time = new Date(updated_at).getTime() -
    new Date(created_at).getTime();
  return { id, created_at, updated_at, elapsed_time };
});

const sortedElapsedTimes = elapsedTimes.sort((a, b) => {
  if (a.elapsed_time < b.elapsed_time) {
    return -1;
  }
  return 1;
});

const toHumanReadable = (milliseconds: number) => {
  return Math.floor(milliseconds / 1000 / 60 * 1000) / 1000;
};

const elapsedTimeStats: Record<string, number | Record<number, number>> = {};

// elapsedTimeStats.average = elapsedTimes.reduce((acc, cur) => {
//   return acc + cur.elapsed_time;
// }, 0) / elapsedTimes.length;

const elapsedTimeArray = elapsedTimes.map((elapsedTime) =>
  elapsedTime.elapsed_time
);

elapsedTimeStats.average = ss.average(
  elapsedTimeArray,
);

// elapsedTimeStats.medium =
//   sortedElapsedTimes[Math.floor(elapsedTimes.length / 2)].elapsed_time;

elapsedTimeStats.medium = ss.median(elapsedTimeArray);

// elapsedTimeStats.max =
//   sortedElapsedTimes[sortedElapsedTimes.length - 1].elapsed_time;
// elapsedTimeStats.min = sortedElapsedTimes[0].elapsed_time;

elapsedTimeStats.max = ss.max(elapsedTimeArray);
elapsedTimeStats.min = ss.min(elapsedTimeArray);

// const squaredDifference = elapsedTimes.map((elapsedTime) => {
//   return (elapsedTime.elapsed_time -
//     elapsedTimeStats.average) ** 2;
// });

elapsedTimeStats.variance = ss.variance(elapsedTimeArray);

// elapsedTimeStats.variance = squaredDifference.reduce((acc, cur) => {
//   return acc + cur;
// }, 0) / elapsedTimes.length;

// elapsedTimeStats.standardDeviation = Math.sqrt(elapsedTimeStats.variance);
elapsedTimeStats.standardDeviation = ss.standardDeviation(elapsedTimeArray);

elapsedTimeStats.percentile = {
  5: toHumanReadable(ss.quantile(elapsedTimeArray, 0.05)),
  25: toHumanReadable(ss.quantile(elapsedTimeArray, 0.25)),
  50: toHumanReadable(ss.quantile(elapsedTimeArray, 0.5)),
  75: toHumanReadable(ss.quantile(elapsedTimeArray, 0.75)),
  90: toHumanReadable(ss.quantile(elapsedTimeArray, 0.9)),
};

console.log(
  JSON.stringify(
    {
      meta: {
        owner: OWNER,
        repo: REPO,
        workflow_id: WORKFLOW_ID,
        start_date: startTime,
        end_date: endTime,
      },
      count: elapsedTimes.length,
      stats: {
        elapsedTime: {
          average: toHumanReadable(elapsedTimeStats.average),
          medium: toHumanReadable(elapsedTimeStats.medium),
          max: toHumanReadable(elapsedTimeStats.max),
          min: toHumanReadable(elapsedTimeStats.min),
          variance: toHumanReadable(toHumanReadable(elapsedTimeStats.variance)),
          standardDeviation: toHumanReadable(
            elapsedTimeStats.standardDeviation,
          ),
          percentile: elapsedTimeStats.percentile,
        },
      },
    },
    null,
    2,
  ),
);
