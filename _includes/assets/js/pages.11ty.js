module.exports = function (pages) {
  return `
    <script>
      window.pages = ${JSON.stringify(pages.full)};
    </script>
  `;
};
