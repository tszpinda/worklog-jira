## create config.json following example below:
```
{
  "host": "<company>.atlassian.net",
  "user": "<jiraUsername>",
  "password": "<jiraUserPassword>",
  "filter": {
    "startDate": "2017/01/01",
    "endDate": "2017/02/28",
    "worklogAuthor": "<userName>"
  },
  "hourlyRate": 100
}
```

## run:
`npm install && node index.js`
