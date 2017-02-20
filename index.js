require('request').defaults({proxy: process.env.HTTP_PROXY})

const JiraApi = require('jira').JiraApi;
const assert = require('assert');

const config = require('./config');

var jira = new JiraApi('https', config.host, config.port, config.user, config.password, 'latest');

function output(seconds) {
  const totalMin = seconds / 60;
  const totalHours = totalMin / 60;
  return{totalMinutes: totalMin, totalHours: totalHours, amount: totalHours * config.hourlyRate};
}

function filterByUser(issue) {
  return issue.author.key === 'tszpinda'
}

function round(aNumber){
  return parseFloat(aNumber).toFixed(2);
}

function flattenWorklogs(worklogList1, worklogList2) {
  return worklogList1.concat(worklogList2);
}

function groupTimePerIssue(groups, issue) {
  let issueGroup = groups[issue.issueId];
  if(!issueGroup)
    issueGroup = {issueId: issue.issueId, timeSpentSeconds: 0};
  issueGroup.timeSpentSeconds += issue.timeSpentSeconds;
  groups[issue.issueId] = issueGroup;
  return groups;
}
function convertObjectKeysToArray(obj) {
  return Object.keys(obj).map(key => obj[key]);
}

function cb(err, res) {
  if(err) throw err;
  let worklogs = res.issues
                  .map(i => i.fields.worklog)
                  .map(worklog => worklog.worklogs)
                  .reduce(flattenWorklogs)
                  .filter(filterByUser);

  const totalSec = worklogs
                      .map(issue => issue.timeSpentSeconds)
                      .reduce((timeSum, time) => timeSum + time);

  const quickTotals = output(totalSec);

  const timePerIssueObj = worklogs.reduce(groupTimePerIssue, {});
  const timePerIssueArr = convertObjectKeysToArray(timePerIssueObj);


  let nice = timePerIssueArr.map(group => {
    const org = res.issues.find(issue => issue.id == group.issueId);
    group.jira = org.key;
    const out = output(group.timeSpentSeconds);
    console.log(org.key, '|', round(out.totalHours), '|', round(out.amount));
    return{jira: org.key, totalHours: out.totalHours, amount: out.amount};
  });

  const totals = nice.reduce((group, entry) => {
    group.hours += entry.totalHours;
    group.amount += entry.amount;
    return group;
  }, {hours: 0, amount: 0});

  console.log('Total Hours:', round(totals.hours), 'Total Amount:', round(totals.amount));

  assert.equal(round(totals.hours), round(quickTotals.totalHours));
  assert.equal(round(totals.amount), round(quickTotals.amount));
}

jira.searchJira(`worklogAuthor = '${config.filter.worklogAuthor}'
                AND worklogDate >= '${config.filter.startDate}'
                                AND worklogDate <= '${config.filter.endDate}'`, {fields: ['worklog']}, cb)
