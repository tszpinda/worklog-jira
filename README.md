## create config.json following example below:
```
{
  "host": "<company>.atlassian.net",
  "user": "<jiraUserEmail>",
  "password": "<jiraUserPassword>",
  "filter": {
    "startDate": "2017/01/01",
    "endDate": "2017/02/28",
    "worklogAuthor": "<displayName (contains first and last name)>"
  },
  "hourlyRate": 100
}
```

## run:
`node install && node index.js`
