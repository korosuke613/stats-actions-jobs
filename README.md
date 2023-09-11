# stats-actions-jobs

```console
❯ GITHUB_API_TOKEN=$(gh auth token) deno run --allow-env --allow-net ./run.ts korosuke613 homepage-2nd 33465674 2023-08-01 2023-08-31
{
  "meta": {
    "owner": "korosuke613",
    "repo": "homepage-2nd",
    "workflow_id": "33465674",
    "start_date": "2023-08-01T00:00:00+09:00",
    "end_date": "2023-08-31T00:00:00+09:00"
  },
  "count": 30,
  "stats": {
    "elapsedTime": {
      "average": 0.586,
      "medium": 0.583,
      "max": 0.833,
      "min": 0.45,
      "variance": 0.006,
      "standardDeviation": 0.08,
      "percentile": {
        "5": 0.466,
        "25": 0.516,
        "50": 0.583,
        "75": 0.65,
        "90": 0.666
      }
    }
  }
}
```
