import axios from "axios";
import { JHU_COVID_URL, HARVARD_COVID_URL } from "../../../constants";

export const fetchHistData = async (country) => {
  try {
    if (country === "all") {
      const {
        data: { cases, deaths, recovered },
      } = await axios.get(`${JHU_COVID_URL}historical/${country}?lastdays=all`);
      return { cases, deaths, recovered };
    } else {
      const {
        data: {
          timeline: { cases, deaths, recovered },
        },
      } = await axios.get(`${JHU_COVID_URL}historical/${country}?lastdays=all`);
      return { cases, deaths, recovered };
    }
  } catch (error) {
    console.log("error");
  }
};

const fetchCountryData = async (type) => {
  try {
    const { data } = await axios.get(`${JHU_COVID_URL}jhucsse`);
    return data.reduce((points, country) => {
      if (!(country.country === "US" || country.coordinates.latitude === "")) {
        points.push({
          name: country.province
            ? country.province + ", " + country.country
            : country.country,
          cases: country.stats[type],
          confirmed: country.stats["confirmed"],
          deaths: country.stats["deaths"],
          coordinates: [
            parseFloat(country.coordinates.longitude),
            parseFloat(country.coordinates.latitude),
          ],
        });
      } else if (
        type === "recovered" &&
        country.country === "US" &&
        country.province === "Recovered"
      ) {
        points.push({
          name: country.country,
          cases: country.stats[type],
          confirmed: country.stats["confirmed"],
          deaths: country.stats["deaths"],
          coordinates: [-98.5795, 39.8283],
        });
      }
      return points;
    }, []);
  } catch (error) {
    console.log("error");
  }
};

const fetchUSCountyData = async (type) => {
  try {
    const { data } = await axios.get(`${JHU_COVID_URL}jhucsse/counties`);
    return data.reduce((points, county) => {
      if (county.coordinates.latitude !== "") {
        points.push({
          name: county.county + ", " + county.province + ", " + county.country,
          cases: county.stats[type],
          confirmed: county.stats["confirmed"],
          deaths: county.stats["deaths"],
          coordinates: [
            parseFloat(county.coordinates.longitude),
            parseFloat(county.coordinates.latitude),
          ],
        });
      }
      return points;
    }, []);
  } catch (error) {
    console.log("error");
  }
};

function movingAvg(arr, avgArr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    let avg = 0;
    let j = 0;
    for (let k = 0; k < 7; k++, j++) {
      if (i - j < 0) {
        break;
      }
      avg += arr[i - j];
    }
    avgArr.unshift(avg / j);
  }
}

export const fetchStateData = async (state) => {
  try {
    let states = {
      dates: [],
      confirmed: [],
      deaths: [],
      recovered: [],
      hospitalizedCurrently: [],
      positiveIncrease: [],
      deathIncrease: [],
      movingAvgCases: [],
    };

    const url = `https://covidtracking.com/api/v1/states/${state}/daily.json`;
    const info = await fetch(`/.netlify/functions/cors?url=${url}`, {
      headers: { accept: "Accept: application/json" },
    });
    const data = await info.json();

    data.msg.forEach((data) => {
      const date = data.date.toString();
      states.dates.unshift(
        date.substring(4, 6) +
          "/" +
          date.substring(6) +
          "/" +
          date.substring(0, 4)
      );
      states.confirmed.unshift(data.positive > 0 ? data.positive : 0);
      states.deaths.unshift(data.death);
      states.recovered.unshift(data.recovered ? data.recovered : 0);
      states.hospitalizedCurrently.unshift(data.hospitalizedCurrently);
      states.positiveIncrease.unshift(
        data.positiveIncrease > 0 ? data.positiveIncrease : 0
      );
      states.deathIncrease.unshift(
        data.deathIncrease > 0 ? data.deathIncrease : 0
      );
    });
    movingAvg(states.positiveIncrease, states.movingAvgCases);
    return states;
  } catch (error) {
    console.log("error");
  }
};

export const fetchData = async (type) => {
  try {
    let other = await fetchCountryData(type);
    if (type !== "recovered") {
      const us = await fetchUSCountyData(type);
      other = other.concat(us);
    }
    return other;
  } catch (error) {
    console.log("error");
  }
};

export const fetchTotalHarvardData = async (table) => {
  const stats = {
    dates: [],
    undergrad_pos: [],
    grad_pos: [],
    staff_pos: [],
    total_pos: [],
    undergrad_tests: [],
    grad_tests: [],
    staff_tests: [],
    total_tests: [],
  };

  try {
    const response = await fetch(
      `/.netlify/functions/google-spreadsheet?id=${HARVARD_COVID_URL}&table=${table}`,
      { headers: { accept: "Accept: application/json" } }
    );
    const data = await response.json();
    data.forEach((data) => {
      stats.dates.unshift(data["Date"]);
      stats.undergrad_pos.unshift(parseInt(data["Undergraduates Positive"]));
      stats.grad_pos.unshift(parseInt(data["Graduate Students Positive"]));
      stats.staff_pos.unshift(
        parseInt(data["Total Faculty and Staff Positive"])
      );
      stats.total_pos.unshift(parseInt(data["Total Positive"]));
      stats.undergrad_tests.unshift(
        parseInt(data["Total Undergraduate Tests"])
      );
      stats.grad_tests.unshift(parseInt(data["Total Graduate Tests"]));
      stats.staff_tests.unshift(
        parseInt(data["Total Faculty and Staff Tests"])
      );
      stats.total_tests.unshift(parseInt(data["Total Tests"]));
    });
  } catch (e) {
    console.log(e);
  }
  return stats;
};

export const fetchDailyHarvardData = async (table) => {
  const stats = {
    dates: [],
    undergrad_pos: [],
    undergrad_pos_avg: [],
    grad_pos: [],
    grad_pos_avg: [],
    staff_pos: [],
    staff_pos_avg: [],
    tests: [],
    tests_avg: [],
  };

  try {
    const response = await fetch(
      `/.netlify/functions/google-spreadsheet?id=${HARVARD_COVID_URL}&table=${table}`,
      { headers: { accept: "Accept: application/json" } }
    );
    const data = await response.json();
    data.forEach((data) => {
      stats.dates.unshift(data["Date"]);
      stats.undergrad_pos.unshift(parseInt(data["Undergrads Positive"]));
      stats.grad_pos.unshift(parseInt(data["Grads Positive"]));
      stats.staff_pos.unshift(parseInt(data["Faculty and Staff Positive"]));
      stats.tests.unshift(parseInt(data["Tests"]));
    });
    movingAvg(stats.undergrad_pos, stats.undergrad_pos_avg);
    movingAvg(stats.grad_pos, stats.grad_pos_avg);
    movingAvg(stats.staff_pos, stats.staff_pos_avg);
    movingAvg(stats.tests, stats.tests_avg);
  } catch (e) {
    console.log(e);
  }
  return stats;
};
