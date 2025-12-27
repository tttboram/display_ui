
const SERVICE_KEY = 'd62feb6b3e43fb95f2af9e228f7f4e93a33f37778489afa4c8d0c40e15524af6'; 
const NX = 60; // 서울 기준 X 좌표
const NY = 127; // 서울 기준 Y 좌표

// localhost proxy 사용시
//const API_URL = 'http://localhost:3005/weather';
// 바로 접근
const API_URL = 'https://apis.data.go.kr';

// 예: 특정 시간(fcstTime)의 데이터 뭉치에서 값 추출
function parseHourlyWeather(items, targetTime) {
    const timeItems = items.filter(i => i.fcstTime === targetTime);
    
    // 필요한 카테고리 값만 추출
    const sky = timeItems.find(i => i.category === 'SKY')?.fcstValue;
    const pty = timeItems.find(i => i.category === 'PTY')?.fcstValue;
    const lgt = timeItems.find(i => i.category === 'LGT')?.fcstValue || "0"; // 단기예보엔 LGT가 없을 수 있음
    
    return getSummaryWeather(sky, pty, lgt);
}

/**
 * 기상청 단기예보(getVilageFcst)용 base_date와 base_time 반환
 */
function getVilageBaseTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 단기예보 발표 시간 리스트
    const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
    
    // 현재 시간보다 이전의 가장 가까운 발표 시간 찾기
    let targetHour = baseTimes.findLast(time => {
        // 발표 시각 + 10분(시스템 반영 시간) 이후인지 확인
        if (hours > time) return true;
        if (hours === time && minutes >= 10) return true;
        return false;
    });

    // 만약 02:10분 이전이라면 '어제 23:00' 데이터를 가져와야 함
    if (targetHour === undefined) {
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        return {
            baseDate: `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`,
            baseTime: '2300'
        };
    }

    const baseDate = `${year}${month}${day}`;
    const baseTime = String(targetHour).padStart(2, '0') + '00';

    return { baseDate, baseTime };
}

/**
 * 기상청 API용 base_date와 base_time을 반환하는 함수
 * @returns {Object} { baseDate, baseTime }
 */
function getUltraBaseTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    let hours = now.getHours();
    const minutes = now.getMinutes();

    // 45분 이전이면 전 시각의 데이터를 호출해야 함
    if (minutes < 45) {
        if (hours === 0) {
            // 00:30분 같은 경우 어제 23시 데이터를 호출
            const yesterday = new Date(now.setDate(now.getDate() - 1));
            return {
                baseDate: `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`,
                baseTime: '2300'
            };
        } else {
            hours = hours - 1;
        }
    }

    const baseTime = String(hours).padStart(2, '0') + '00';
    const baseDate = `${year}${month}${day}`;

    return { baseDate, baseTime };
}

const skyMap = { '1': '맑음', '3': '구름많음', '4': '흐림' };
const ptyMap = { '0': '', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };

function getWeatherStatusLabel(sky, pty) {
    // 1. 강수 상태 우선 확인 (비나 눈은 밤낮 구분 없이 동일)
    if (pty > 0) {
        if (pty == 1) return ptyMap[pty] || '';
        if (pty == 2) return ptyMap[pty] || '';
        if (pty == 3) return ptyMap[pty] || '';
        if (pty == 4) return ptyMap[pty] || '';
    }

    if (sky == 1) return skyMap[sky] || '';
    if (sky == 3) return skyMap[sky] || '';
    if (sky == 4) return skyMap[sky] || '';
    return "";
}

 // --- 영문 매핑 (English Mapping) ---
    const skyMapEn = { 
        '1': 'Sunny', 
        '3': 'Partly Cloudy', 
        '4': 'Cloudy' 
    };
    const ptyMapEn = { 
        '0': '', 
        '1': 'Rain', 
        '2': 'Rain/Snow', 
        '3': 'Snow', 
        '4': 'Shower' 
    };

    
function getWeatherStatusLabel_En(sky, pty) {
    // 강수 상태 우선 확인 (비나 눈은 밤낮 구분 없이 동일)
    if (pty > 0) {
        if (pty == 1) return ptyMapEn[pty] || '';
        if (pty == 2) return ptyMapEn[pty] || '';
        if (pty == 3) return ptyMapEn[pty] || '';
        if (pty == 4) return ptyMapEn[pty] || '';
    }

    if (sky == 1) return skyMapEn[sky] || '';
    if (sky == 3) return skyMapEn[sky] || '';
    if (sky == 4) return skyMapEn[sky] || '';
    return "";
}


const ptyMedia = [["", "day_rain_1.mp4", "day_rain_1.mp4", "day_snow_1.mp4", "day_rain_1.mp4"], ["", "day_rain_2.mp4", "day_rain_2.mp4", "day_snow_2.mp4", "day_rain_2.mp4"]];
const skyMedia = [["", "day_clear_1.mp4", "", "day_cloudy_1.mp4", "day_cloudy_1.mp4"], ["", "day_clear_2.mp4", "", "day_cloudy_2.mp4", "day_cloudy_2.mp4"]];
const skyNightMedia = [["", "day_clear_1.mp4", "", "day_cloudy_1.mp4", "day_cloudy_1.mp4"], ["", "day_clear_2.mp4", "", "day_cloudy_2.mp4", "day_cloudy_2.mp4"]];

function getWeatherMediaName(gubun, sky, pty, hour) {
    // 1. 강수 상태 우선 확인 (비나 눈은 밤낮 구분 없이 동일)
    if (pty > 0) {
        if (pty == 1) return ptyMedia[gubun][1];
        if (pty == 2) return ptyMedia[gubun][2];
        if (pty == 3) return ptyMedia[gubun][3];
        if (pty == 4) return ptyMedia[gubun][4];
    }

    // 2. 밤 시간대 판정 (저녁 18시 이후 ~ 새벽 06시 이전)
    const isNight = (hour >= 18 || hour < 6);

    // 3. 하늘 상태 확인
    if (sky == 1) {
        return isNight ? skyNightMedia[gubun][1] : skyMedia[gubun][1];
    }
    if (sky == 3) {
        return isNight ? skyNightMedia[gubun][3] : skyMedia[gubun][3];
    }
    if (sky == 4) {
        return isNight ? skyNightMedia[gubun][4] : skyMedia[gubun][4];
    }

    return "";
}

const ptyGif = ["", "icon_rain.gif", "icon_rain.gif", "icon_rain.gif", "icon_rain.gif"];
const skyMGif = ["", "icon_sun.gif", "", "icon_sun_cloud.gif", "icon_cloud.gif"];
const skyNightGif = ["", "icon_moon.gif", "", "icon_moon_cloud.gi", "icon_cloud.gif"];

function getWeatherGif(sky, pty, hour) {
    // 1. 강수 상태 우선 확인 (비나 눈은 밤낮 구분 없이 동일)
    if (pty > 0) {
        if (pty == 1) return ptyGif[1];
        if (pty == 2) return ptyGif[2];
        if (pty == 3) return ptyGif[3];
        if (pty == 4) return ptyGif[4];
    }

    // 2. 밤 시간대 판정 (저녁 18시 이후 ~ 새벽 06시 이전)
    const isNight = (hour >= 18 || hour < 6);

    // 3. 하늘 상태 확인
    if (sky == 1) {
        return isNight ? skyNightGif[1] : skyMGif[1];
    }
    if (sky == 3) {
        return isNight ? skyNightGif[3] : skyMGif[3];
    }
    if (sky == 4) {
        return isNight ? skyNightGif[4] : skyMGif[4];
    }

    return "";
}

// 기준 시간 배열
  const timeSlots = [10, 12, 14, 16, 18, 20];

  function getRecentTime() {
      // 2. 현재 시간의 '시' 구하기 (0~23)
      const nowHour = new Date().getHours(); 
      
      // 3. 현재 시간보다 작거나 같은(과거/현재) 시간들만 필터링
      const pastTimes = timeSlots.filter(time => time <= nowHour);

      // 4. 필터링된 값 중 가장 큰 값(최근 시간) 찾기
      if (pastTimes.length > 0) {
          return Math.max(...pastTimes);
      } else {
          // 만약 현재 시간이 8시 이전이라면 가장 마지막 시간(어제의 마지막 시간) 
          // 혹은 특정 기본값(예: 8)을 반환하도록 설정
          return timeSlots[timeSlots.length - 1]; 
      }
  }

  function splitTemperature (temp) {
    const isNegative = temp < 0;
    const absValue = Math.abs(temp).toString(); // 절대값 문자열 변환 ("12" 또는 "5")
    
    let sign = isNegative ? '-' : ''; // 음수일 때만 기호 추가 (양수는 빈값)
    let tens = '';
    let units = '';

    if (absValue.length === 2) {
        // 두 자리 수인 경우 (-12, 25 등)
        tens = absValue[0];
        units = absValue[1];
    } else {
        // 한 자리 수인 경우 (-5, 8 등)
        tens = ''; // 또는 '0'으로 설정 가능
        units = absValue[0];
    }

    return { sign, tens, units };
}