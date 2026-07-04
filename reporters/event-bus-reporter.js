export default class SimpleEventReporter {
    onRunStart() {
      console.log('\n[REPORT] Starting Event Bus test run...\n');
    }
  
    onTestCaseResult(_test, testCaseResult) {
      const icon = testCaseResult.status === 'passed' ? '✅' : '❌';
      console.log(`[REPORT] ${icon} ${testCaseResult.fullName}`);
    }
  
    onRunComplete(_contexts, results) {
      const { numTotalTests, numPassedTests, numFailedTests } = results;
      console.log('\n[REPORT] Event Bus test run summary');
      console.log(`[REPORT] Total: ${numTotalTests} | Passed: ${numPassedTests} | Failed: ${numFailedTests}\n`);
    }
  }