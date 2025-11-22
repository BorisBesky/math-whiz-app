  const formatDate = (date) => {
    if (!date) return 'Never';
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Formatting date:", date);
      }

      if (date instanceof Date) {
        if (Number.isNaN(date.getTime())) {
          throw new Error('Invalid Date instance');
        }
        return date.toLocaleDateString();
      }

      const dateString = typeof date === 'string' ? date : String(date);

      // Handle YYYY-MM-DD format directly to avoid timezone issues
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return dateObj.toLocaleDateString();
      }
      // Handle MM/DD/YYYY format
      if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [month, day, year] = dateString.split('/');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return dateObj.toLocaleDateString();
      }
      // Fallback to original parsing
      const parsedDate = new Date(dateString);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error('Unable to parse date string');
      }
      return parsedDate.toLocaleDateString();
    } catch (error) {
      console.warn("Failed to format date:", date, " because of error:", error);
      return '';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    try {
      const parsedDate = new Date(date);
      return parsedDate.toLocaleTimeString();
    } catch {
      return date;
    }
  };

  export { formatDate, formatTime };