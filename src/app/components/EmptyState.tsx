import svgPaths from "../../imports/svg-jiovadl56x";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="text-center" style={{ maxWidth: '500px' }}>
        {/* Empty state icon */}
        <div className="mb-4">
          <svg width="97" height="60" viewBox="0 0 97.2076 59.5074" fill="none">
            <g>
              <rect fill="white" fillOpacity="0.01" height="59.5074" width="97.2076" />
              <path clipRule="evenodd" d={svgPaths.p17c3180} fill="url(#paint0_linear_1_15838)" fillRule="evenodd" opacity="0.8" />
              <path d={svgPaths.p216c1cc0} fill="url(#paint1_linear_1_15838)" />
              <path clipRule="evenodd" d={svgPaths.p26b81500} fill="url(#paint2_linear_1_15838)" fillRule="evenodd" opacity="0.675" />
              <g>
                <path d={svgPaths.p38e73200} fill="url(#paint3_linear_1_15838)" />
                <path d={svgPaths.p38b43400} fill="url(#paint4_linear_1_15838)" />
                <path d={svgPaths.p149a2000} fill="url(#paint5_linear_1_15838)" />
              </g>
            </g>
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_15838" x1="50.2677" x2="50.2677" y1="27.7125" y2="-6.55011">
                <stop stopColor="#DEDEDE" stopOpacity="0" />
                <stop offset="1" stopColor="#A9A9A9" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_15838" x1="46.0107" x2="46.0107" y1="56.7336" y2="47.0166">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="#96A1C5" stopOpacity="0.373" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_15838" x1="48.6038" x2="48.6038" y1="59.5074" y2="43.5501">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="#919191" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_1_15838" x1="48.0418" x2="48.0418" y1="29.8153" y2="35.9497">
                <stop stopColor="#5389F5" />
                <stop offset="1" stopColor="#416FDC" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_1_15838" x1="51.8618" x2="51.8618" y1="47.6473" y2="35.146">
                <stop stopColor="#DCE9FF" />
                <stop offset="1" stopColor="#B6CFFF" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_1_15838" x1="48.0422" x2="48.0422" y1="38.9046" y2="50.8386">
                <stop stopColor="#7CA5F7" />
                <stop offset="1" stopColor="#C4D6FC" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="mb-4">
          <p className="mb-2 fw-normal" style={{ fontSize: '16px', color: '#212529' }}>
            You don't have any major work projects yet!
          </p>
          <p className="text-muted" style={{ fontSize: '16px' }}>
            Your all Section 20 projects will be displayed here. To get started:
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onCreateClick}
          style={{ fontSize: '16px' }}
        >
          Create new Section 20
        </button>
      </div>
    </div>
  );
}
