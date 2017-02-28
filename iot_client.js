var WATER_MARK = 0;  // timestampe of where we are up to
var SAMPLE_SIZE = 200;
var POLL_INPUTS = 10;

if ((WATER_MARK - SAMPLE_SIZE) < SAMPLE_SIZE) {
  console.log('SAMPLE_SIZE: ' +SAMPLE_SIZE+ ' is greater than SAMPLE_SIZE minus WATER_MARK');
}
