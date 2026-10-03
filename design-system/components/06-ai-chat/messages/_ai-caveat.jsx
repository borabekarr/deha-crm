(function () {
  function AiCaveat() {
    return (
      <div className="card">

        {/* Caveat banner */}
        <div className="ai-caveat">
          <span className="material-icons ai-caveat-icon">warning</span>
          <span className="ai-caveat-text">
            AI responses can be inaccurate or misleading.{' '}
            <a className="ai-caveat-link">Learn more</a>
          </span>
        </div>

      </div>
    );
  }

  window.AiCaveat = AiCaveat;
})();
