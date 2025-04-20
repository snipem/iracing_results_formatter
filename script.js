function formatSessions(data) {
  const sessions = data.session_results;
  let output = '';

  sessions.forEach((session, sessionIndex) => {
    const sessionName = session.simsession_type_name || `Session ${sessionIndex + 1}`;
    output += `<h2>${sessionName}</h2><pre>\n`;

    const standings = session.results.map((result, index) => {
      const position = result.position + 1;
      const name = result.display_name || 'Unknown';
      const laps = result.laps_complete || 0;
      const class_interval = formatTime(result.class_interval / 100 || 0);
      const carClass = result.car_class_short_name || 'N/A';
      return `${position.toString().padStart(2, ' ')}  ${name.padEnd(20, ' ')}  ${laps.toString().padStart(3, ' ')}L  ${class_interval.toString().padStart(6, ' ')}  ${carClass.replaceAll(" Class", "")}`;
    });

    output += formatTable(standings, ['P.', 'Name', 'L.', 'Int.', 'Cat.']);
    output += '</pre>';
  });

  return output;
}

function shortenName(name, maxLength) {
  if (name.length <= maxLength || maxLength <= 0) return name; // Base case
  if (name.length === 1) return '~'; // Prevent infinite recursion for very short names
  return name.slice(0, maxLength - 1) + '~';
}

function formatTable(rows, headers) {
  const maxLineLength = 30;

  // Calculate column widths
  const columnWidths = headers.map((header, index) => {
    return Math.max(
      header.length,
      ...rows.map(row => row.split(/\s{2,}/)[index]?.trim().length || 0)
    );
  });

  // Format the header row
  const headerRow = headers
    .map((header, index) => header.padEnd(columnWidths[index]))
    .join('  ') + '\n';

  // Add a separator line
  const separatorRow = columnWidths
    .map(width => '-'.repeat(width))
    .join('  ') + '\n';

  // Format the body rows
  const bodyRows = rows.map(row => {
    const cells = row.split(/\s{2,}/).map((cell, index) => cell.trim());
    let formattedRow = cells
      .map((cell, index) => {
        if (headers[index] === 'Int.') {
          return cell.padStart(columnWidths[index]); // Align "Interval" column to the right
        }
        return cell.padEnd(columnWidths[index]); // Default left alignment
      })
      .join('  ');

    // If the row exceeds max length, shorten the name
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
    return '*'; // No time
  }
  if (milliseconds < 1000) {
    return `${Math.floor(milliseconds).toString()}ms`; // No decimal places
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`; // Whole seconds
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}m`; // Minutes and seconds
  }
}
