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

function cb(err, res) {
  let orginalList = res.issues.map(i => i.fields.worklog).map(worklog => worklog.worklogs);

  let result = orginalList.reduce((arr, one) => {
    return arr.concat(one);
  }).filter(filterByUser);

  const timeSpentSeconds = result.map(issue => issue.timeSpentSeconds);
  const totalSec = timeSpentSeconds.reduce((a,b)=>a+b);
  const quickTotals = output(totalSec);

  const firstElement = {};
  const timeSpentSecondsPerIssue = result.reduce((group, issue) => {
    const groupKey = issue.issueId + 'group';
    let issueGroup = group[groupKey] || {};
    issueGroup.key = groupKey;
    issueGroup.issueId = issue.issueId;
    issueGroup.timeSpentSeconds = issueGroup.timeSpentSeconds ? issueGroup.timeSpentSeconds + issue.timeSpentSeconds : issue.timeSpentSeconds;
    group[groupKey] = issueGroup;
    return group;
  }, firstElement);

  let nice = Object.keys(timeSpentSecondsPerIssue).map(key => timeSpentSecondsPerIssue[key]);

  nice = nice.map(group => {
    const org = res.issues.find(issue => issue.id == group.issueId);
    group.jira = org.key;
    const out = output(group.timeSpentSeconds);
    console.log(org.key, '|', round(out.totalHours), '|', round(out.amount));
    return{jira: org.key, totalHours: out.totalHours, amount: out.amount};
  });

  const totals = nice.reduce((group, entry) => {
    group.hours = group.hours ? group.hours + entry.totalHours : entry.totalHours;
    group.amount = group.amount ? group.amount + entry.amount : entry.amount;
    return group;
  }, {});
  console.log('Total Hours:', round(totals.hours), 'Total Amount:', round(totals.amount));
  assert.equal(round(totals.hours), round(quickTotals.totalHours));
  assert.equal(round(totals.amount), round(quickTotals.amount));
}

jira.searchJira(`worklogAuthor = '${config.filter.worklogAuthor}'
                AND worklogDate >= '${config.filter.startDate}'
                                AND worklogDate <= '${config.filter.endDate}'`, {fields: ['worklog']}, cb)
