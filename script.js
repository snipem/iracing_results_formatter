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

      isDNF = result.reason_out === "Disconnected" || false;
      isDSQ = result.reason_out === "Disqualified" || false;

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

      let class_intervall_or_reason_out;

      if (isDNF) { class_intervall_or_reason_out = 'DNF'; }
      else if (isDSQ) {class_intervall_or_reason_out = 'DSQ';}
      else { class_intervall_or_reason_out = class_interval; }


      const carClass = result.car_class_short_name || 'N/A';
      return `${position.toString().padStart(2, ' ')}  ${name.padEnd(20, ' ')}  ${class_intervall_or_reason_out.toString().padStart(6, ' ')}  ${carClass.replaceAll(" Class", "")}`;
    });

    output += formatTable(standings, ['P.', 'Name', 'Int.', 'Cat.']);

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
  if (!name || name.length === 0) return name;

  const parts = name.split(/\s+/); // Split by whitespace
  if (parts.length > 0) {
    parts[0] = parts[0][0] + '.'; // Replace the first word with its initial and a period
  }

  const shortenedName = parts.join(' '); // Rejoin the name
  return shortenedName.length <= maxLength ? shortenedName : shortenedName.slice(0, maxLength - 1) + '~';
}

function generateTable(rows, headers, columnWidths) {
  const headerRow = headers
      .map((header, index) => header.padEnd(columnWidths[index]))
      .join('  ') + '\n';

  const separatorRow = columnWidths
      .map(width => '-'.repeat(width))
      .join('  ') + '\n';

  const bodyRows = rows.map(row => {
    const cells = row.split(/\s{2,}/).map((cell, index) => cell.trim());
    return cells
        .map((cell, index) => {
          if (headers[index] === 'Int.') {
            return cell.padStart(columnWidths[index]);
          }
          return cell.padEnd(columnWidths[index]);
        })
        .join('  ');
  }).join('\n');

  return headerRow + separatorRow + bodyRows + '\n';
}

function formatTable(rows, headers) {
  const maxLineLength = 30; // Maximum allowed line length

  // Check if the "Cat." column has uniform values
  const categoryIndex = headers.indexOf('Cat.');
  if (categoryIndex !== -1) {
    const allCategories = rows.map(row => row.split(/\s{2,}/)[categoryIndex]?.trim());
    const isUniformCategory = allCategories.every(cat => cat === allCategories[0]);

    if (isUniformCategory) {
      // Remove the "Cat." column
      headers.splice(categoryIndex, 1);
      rows = rows.map(row => {
        const cells = row.split(/\s{2,}/);
        cells.splice(categoryIndex, 1);
        return cells.join('  ');
      });
    }
  }

  // Calculate column widths
  const columnWidths = headers.map((header, index) => {
    return Math.max(
        header.length,
        ...rows.map(row => row.split(/\s{2,}/)[index]?.trim().length || 0)
    );
  });

  // Generate the table
  let table = generateTable(rows, headers, columnWidths);

  // Check if the table exceeds the max line length
  while (table.split('\n').some(line => line.length > maxLineLength)) {
    const nameIndex = headers.indexOf('Name');
    if (nameIndex === -1) break; // No "Name" column to shorten

    // Shorten the "Name" column
    rows = rows.map(row => {
      const cells = row.split(/\s{2,}/);
      cells[nameIndex] = shortenName(cells[nameIndex], columnWidths[nameIndex] - 1);
      return cells.join('  ');
    });

    // Recalculate column widths
    columnWidths[nameIndex] = Math.max(
        headers[nameIndex].length,
        ...rows.map(row => row.split(/\s{2,}/)[nameIndex]?.trim().length || 0)
    );

    // Regenerate the table
    table = generateTable(rows, headers, columnWidths);
  }

  return table;
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
