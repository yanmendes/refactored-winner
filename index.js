module.exports = logs => {
  const drivers = {}

  logs.forEach(([, driver, lap, time, avgSpeed]) => {
    if (!drivers[driver]) {
      const [code, name] = driver.split(' – ')
      drivers[driver] = newDriver(code, name)
    }

    const [, mins, seconds, milliseconds] = /(\d+):(\d+)\.(\d+)/.exec(time)
    drivers[driver].laps.push({
      lap,
      time: {
        mins: parseInt(mins, 10),
        seconds: parseInt(seconds, 10),
        milliseconds: parseInt(milliseconds, 10)
      },
      avgSpeed
    })
  })

  return Object.values(drivers)
    .map(driver => ({
      ...driver,
      totalRaceTime: getTotalRaceTime(driver.laps),
      lapsCompleted: driver.laps.length,
      globalAvgSpeed: getGlobalAvgSpeed(driver.laps),
      bestLap: getBestLap(driver.laps)
    }))
    .map(driver => ({
      ...driver,
      totalRaceTimeInMs: getTimeInMs(driver.totalRaceTime)
    }))
    .sort((a, b) => {
      if (a.lapsCompleted > b.lapsCompleted) return -1
      else if (a.lapsCompleted < b.lapsCompleted) return 1
      if (a.totalRaceTimeInMs < b.totalRaceTimeInMs) return -1
      else if (a.totalRaceTimeInMs > b.totalRaceTimeInMs) return 1
    })
    .map(({ laps, totalRaceTimeInMs, bestLap, totalRaceTime, ...driver }, i) => ({
      ...driver,
      totalRaceTime: getFormatedTime(totalRaceTime),
      bestLap: getFormatedTime(bestLap),
      position: i + 1
    }))
}

const getTimeInMs = ({ mins, seconds, milliseconds }) => (mins * 60 + seconds) * 1000 + milliseconds

const getFormatedTime = ({ mins, seconds, milliseconds }) => `${mins}:${seconds}.${milliseconds}`

const newDriver = (code, name) => ({
  code,
  name,
  laps: []
})

const getGlobalAvgSpeed = laps =>
  laps.reduce((prev, { avgSpeed }) => prev + avgSpeed, 0) / laps.length

const getBestLap = laps =>
  laps.reduce((prev, { time }) => (prev < getTimeInMs(time) ? prev : time), Infinity)

const getTotalRaceTime = laps =>
  laps.reduce(
    (prev, { time }) => {
      const milliseconds = time.milliseconds + prev.milliseconds
      const carriedMilliseconds = milliseconds > 1000
      const seconds = time.seconds + prev.seconds + carriedMilliseconds
      const carriedSeconds = seconds > 60
      const mins = time.mins + prev.mins + carriedSeconds

      return {
        milliseconds: milliseconds % 1000,
        seconds: seconds % 60,
        mins
      }
    },
    { mins: 0, seconds: 0, milliseconds: 0 }
  )
