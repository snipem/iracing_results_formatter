function formatSessions(data) {
  const sessions = data.session_results;

  const startTime = data.start_time
      ? new Date(data.start_time).toLocaleString()
      : 'N/A';
  const trackName = data.track?.track_name || 'N/A';

  let output = `<h1>*Session Results*</h1>\n`;
  output += `<p>Start Time: ${startTime}</p>\n`;
  output += `<p>Track Name: ${trackName}</p>\n`;



  sessions.forEach((session, sessionIndex) => {

    // ignore if open practice
    if (session.simsession_type_name === "Open Practice") {
      return;
    }

    const sessionName = session.simsession_type_name || `Session ${sessionIndex + 1}`;
    output += `<h2>*${sessionName}*</h2><pre>\n`;
    output += "```\n";

    // Get standings

    const standings = session.results.map((result, index) => {

      isDNF = result.reason_out !== "Running" || false;

      const position = result.position + 1;
      const name = result.display_name || 'Unknown';
      const laps = result.laps_complete || 0;

      var class_interval = formatTime(result.class_interval / 10 || 0);

      // if class interval is "-" then give the difference in laps to the leader
        if (class_interval === '-') {
            const leaderLaps = session.results[0].laps_complete || 0;
            const lapsBehindLeader = leaderLaps - laps;
            class_interval = `+${lapsBehindLeader}L`;
        }

      const class_interval_or_dnf = isDNF ? 'DNF' : class_interval;


      const carClass = result.car_class_short_name || 'N/A';
      return `${position.toString().padStart(2, ' ')}  ${name.padEnd(20, ' ')}  ${laps.toString().padStart(3, ' ')}L  ${class_interval_or_dnf.toString().padStart(6, ' ')}  ${carClass.replaceAll(" Class", "")}`;
    });

    output += formatTable(standings, ['P.', 'Name', 'L.', 'Int.', 'Cat.']);

    // Get best lap

    const bestLap = session.results.reduce((best, result) => {
      const lapTime = result.best_lap_time;
      if (lapTime !== undefined && (best === null || lapTime < best.lapTime)) {
        return { name: result.display_name || 'Unknown', lapTime };
      }
      return best;
    })

    output += "\n";

    output += `Fastest Lap: ${bestLap ? bestLap.display_name : 'N/A'} - ${formatSportsTiming(bestLap ? bestLap.best_lap_time : null)}\n`;
    output += "```\n";
    output += "\n";

    output += '</pre>';
  });

  return output;
}

function shortenName(name, maxLength) {
  if (name.length <= maxLength || maxLength <= 0) return name;
  if (name.length === 1) return '~';
  return name.slice(0, maxLength - 1) + '~';
}

function formatTable(rows, headers) {
  const maxLineLength = 30;

  const columnWidths = headers.map((header, index) => {
    return Math.max(
        header.length,
        ...rows.map(row => row.split(/\s{2,}/)[index]?.trim().length || 0)
    );
  });

  const headerRow = headers
      .map((header, index) => header.padEnd(columnWidths[index]))
      .join('  ') + '\n';

  const separatorRow = columnWidths
      .map(width => '-'.repeat(width))
      .join('  ') + '\n';

  const bodyRows = rows.map(row => {
    const cells = row.split(/\s{2,}/).map((cell, index) => cell.trim());
    let formattedRow = cells
        .map((cell, index) => {
          if (headers[index] === 'Int.') {
            return cell.padStart(columnWidths[index]);
          }
          return cell.padEnd(columnWidths[index]);
        })
        .join('  ');

    if (formattedRow.length > maxLineLength) {
      const nameIndex = headers.indexOf('Name');
      if (nameIndex !== -1) {
        cells[nameIndex] = shortenName(cells[nameIndex], columnWidths[nameIndex] - 1);
        formattedRow = cells
            .map((cell, index) => {
              if (headers[index] === 'Int.') {
                return cell.padStart(columnWidths[index]);
              }
              return cell.padEnd(columnWidths[index]);
            })
            .join('  ');
      }
    }

    return formattedRow;
  }).join('\n');

  return headerRow + separatorRow + bodyRows + '\n';
}

function formatTime(milliseconds) {
  if (milliseconds === undefined || milliseconds === null || milliseconds < 0) {
    return '-';
  }
  if (milliseconds === 0) {
    return '*';
  }
  if (milliseconds < 1000) {
    return `${Math.floor(milliseconds).toString()}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}m`;
  }
}

function formatSportsTiming(milliseconds) {
  if (milliseconds === undefined || milliseconds === null || milliseconds < 0) {
    return '-';
  }
  milliseconds = Math.floor(milliseconds / 10); // Adjust for extra zero

  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millisecondsPart = Math.floor(milliseconds % 1000); // Ensure only three digits

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millisecondsPart.toString().padStart(3, '0')}`;
}


// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatSessions, formatTime, formatTable, shortenName };
}
