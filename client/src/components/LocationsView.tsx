import React from 'react';

interface POI {
  poiId: string;
  name: string;
  type: string;
  district?: string;
  description: string;
  available: boolean;
  price?: number;
  owner?: string;
}

interface LocationsViewProps {
  pois: POI[];
  loading: boolean;
  cityName: string;
  cityMapUrl?: string;
  selectedPOI: POI | null;
  onSelectPOI: (poi: POI) => void;
  onPurchaseProperty: (poi: POI) => void;
  onRegenerate: () => void;
  onUploadWatabou?: () => void;
}

const POI_ICONS: Record<string, string> = {
  castle: '🏰',
  temple: '⛪',
  tavern: '🍺',
  shop: '🏪',
  guild: '🛡️',
  plaza: '🏛️',
  residence: '🏡',
  port: '⚓',
  barracks: '⚔️',
};

export const LocationsView: React.FC<LocationsViewProps> = ({
  pois,
  loading,
  cityName,
  cityMapUrl,
  selectedPOI,
  onSelectPOI,
  onPurchaseProperty,
  onRegenerate,
  onUploadWatabou
}) => {
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('map');
  const [editMode, setEditMode] = React.useState(false);
  const [selectedForPlacement, setSelectedForPlacement] = React.useState<typeof poisWithPositions[0] | null>(null);

  // Assign smart positions to POIs based on their type
  const poisWithPositions = React.useMemo(() => {
    const positionedByType: Record<string, number> = {};

    return pois.map((poi) => {
      // Track how many of each type we've placed
      if (!positionedByType[poi.type]) {
        positionedByType[poi.type] = 0;
      }
      const typeIndex = positionedByType[poi.type]++;

      let x = 50, y = 50; // Default center

      // Position based on type (approximating typical medieval city layout)
      switch (poi.type) {
        case 'castle':
          // Castles go in the center
          x = 50 + (typeIndex * 2 - 1) * 3;
          y = 45 + (typeIndex * 2 - 1) * 3;
          break;
        case 'temple':
          // Temples scattered in inner city
          x = 45 + typeIndex * 10;
          y = 40 + typeIndex * 8;
          break;
        case 'plaza':
          // Plaza near center
          x = 50;
          y = 52;
          break;
        case 'barracks':
          // Barracks near walls
          x = 35 + typeIndex * 15;
          y = 30;
          break;
        case 'port':
          // Ports at the edges (south/southwest based on typical Watabou layouts)
          x = 30 + typeIndex * 10;
          y = 70;
          break;
        case 'tavern':
          // Taverns scattered throughout
          const tavernAngles = [0, 60, 120, 180, 240, 300];
          const angle = tavernAngles[typeIndex % tavernAngles.length] * Math.PI / 180;
          const radius = 15 + (typeIndex % 2) * 10;
          x = 50 + Math.cos(angle) * radius;
          y = 50 + Math.sin(angle) * radius;
          break;
        case 'shop':
          // Shops in market/commercial areas
          x = 40 + typeIndex * 8;
          y = 55 + typeIndex * 5;
          break;
        case 'guild':
          // Guilds in different quarters
          const guildPositions = [[40, 40], [60, 40], [50, 60]];
          const pos = guildPositions[typeIndex % guildPositions.length];
          x = pos[0];
          y = pos[1];
          break;
        case 'residence':
          // Residences in residential quarters (spread around)
          x = 35 + (typeIndex % 3) * 15;
          y = 45 + Math.floor(typeIndex / 3) * 10;
          break;
      }

      return {
        ...poi,
        x: Math.max(20, Math.min(80, x)),
        y: Math.max(20, Math.min(80, y))
      };
    });
  }, [pois]);

  // Group POIs by type
  const groupedPOIs = poisWithPositions.reduce((acc, poi) => {
    if (!acc[poi.type]) {
      acc[poi.type] = [];
    }
    acc[poi.type].push(poi);
    return acc;
  }, {} as Record<string, typeof poisWithPositions>);

  const typeOrder = ['castle', 'temple', 'plaza', 'tavern', 'shop', 'guild', 'port', 'barracks', 'residence'];
  const sortedTypes = typeOrder.filter(type => groupedPOIs[type]);

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999'
      }}>
        <h2>Loading locations...</h2>
      </div>
    );
  }

  if (pois.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#999',
        gap: '20px',
        padding: '40px'
      }}>
        <h2>No Locations Found</h2>
        <p>Generate key locations for {cityName}</p>
        <button
          onClick={onRegenerate}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Generate Locations
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '2px solid #444'
      }}>
        <h2 style={{ color: 'white', margin: 0 }}>Locations in {cityName}</h2>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Map/List Toggle */}
          {cityMapUrl && (
            <div style={{ display: 'flex', gap: '5px', backgroundColor: '#333', borderRadius: '6px', padding: '4px' }}>
              <button
                onClick={() => setViewMode('map')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: viewMode === 'map' ? '#4CAF50' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🗺️ Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: viewMode === 'list' ? '#4CAF50' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 List
              </button>
            </div>
          )}

          <button
            onClick={onRegenerate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔄 Regenerate
          </button>

          {onUploadWatabou && (
            <button
              onClick={onUploadWatabou}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              📤 Upload Watabou JSON
            </button>
          )}

          {viewMode === 'map' && cityMapUrl && (
            <button
              onClick={() => {
                setEditMode(!editMode);
                if (!editMode) setSelectedForPlacement(poisWithPositions[0]);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: editMode ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {editMode ? '✅ Done Editing' : '📍 Edit Positions'}
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Instructions */}
      {editMode && selectedForPlacement && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#2196F3',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Click on the map to place: {POI_ICONS[selectedForPlacement.type]} {selectedForPlacement.name}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'map' && cityMapUrl ? (
          // Map View with POI Markers
          <>
            {/* POI List Sidebar in Edit Mode */}
            {editMode && (
              <div style={{
                width: '250px',
                backgroundColor: '#1a1a1a',
                borderRight: '2px solid #444',
                overflowY: 'auto',
                padding: '15px'
              }}>
                <h3 style={{ color: 'white', marginTop: 0 }}>Place POIs</h3>
                {poisWithPositions.map((poi) => (
                  <div
                    key={poi.poiId}
                    onClick={() => setSelectedForPlacement(poi)}
                    style={{
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: selectedForPlacement?.poiId === poi.poiId ? '#2196F3' : '#2a2a2a',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedForPlacement?.poiId !== poi.poiId) {
                        e.currentTarget.style.backgroundColor = '#353535';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedForPlacement?.poiId !== poi.poiId) {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                      }
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                      {POI_ICONS[poi.type]} {poi.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {poi.district}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: editMode ? 'crosshair' : 'default' }}
              onClick={(e) => {
                if (editMode && selectedForPlacement) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;

                  // Update the position of the selected POI
                  const index = poisWithPositions.findIndex(p => p.poiId === selectedForPlacement.poiId);
                  if (index !== -1) {
                    poisWithPositions[index].x = x;
                    poisWithPositions[index].y = y;

                    // Move to next POI
                    const nextIndex = (index + 1) % poisWithPositions.length;
                    setSelectedForPlacement(poisWithPositions[nextIndex]);

                    // Force re-render
                    onSelectPOI(null!);
                  }
                }
              }}
            >
              {/* City Map Background */}
              <iframe
                src={cityMapUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none'
                }}
                title="City Map Background"
              />

              {/* POI Markers Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}>
                {poisWithPositions.map((poi) => (
                  <div
                    key={poi.poiId}
                    onClick={() => onSelectPOI(poi)}
                    style={{
                      position: 'absolute',
                      left: `${poi.x}%`,
                      top: `${poi.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      filter: selectedPOI?.poiId === poi.poiId
                        ? 'drop-shadow(0 0 10px gold)'
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                      transition: 'all 0.2s',
                      zIndex: selectedPOI?.poiId === poi.poiId ? 1000 : 100
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    }}
                    title={poi.name}
                  >
                    {POI_ICONS[poi.type] || '📍'}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected POI Details Panel */}
            {selectedPOI && (
              <div style={{
                width: '400px',
                borderLeft: '2px solid #444',
                backgroundColor: '#0d0d0d',
                padding: '30px',
                overflowY: 'auto'
              }}>
                <button
                  onClick={() => onSelectPOI(null!)}
                  style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ← Close
                </button>

                <div style={{ color: 'white' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{POI_ICONS[selectedPOI.type] || '📍'}</span>
                    {selectedPOI.name}
                  </h2>

                  {selectedPOI.district && (
                    <p style={{ color: '#4CAF50', fontSize: '1.1rem', marginBottom: '20px' }}>
                      {selectedPOI.district}
                    </p>
                  )}

                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#ccc', marginBottom: '30px' }}>
                    {selectedPOI.description}
                  </p>

                  {renderActions(selectedPOI, onPurchaseProperty)}
                </div>
              </div>
            )}
          </>
        ) : (
          // List View
          <>
            <div style={{
              width: selectedPOI ? '60%' : '100%',
              overflowY: 'auto',
              padding: '20px',
              transition: 'width 0.3s'
            }}>
              {sortedTypes.map(type => (
                <div key={type} style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    color: '#4CAF50',
                    fontSize: '1.1rem',
                    marginBottom: '15px',
                    textTransform: 'capitalize'
                  }}>
                    {POI_ICONS[type] || '📍'} {type}s
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupedPOIs[type].map(poi => (
                      <div
                        key={poi.poiId}
                        onClick={() => onSelectPOI(poi)}
                        style={{
                          padding: '15px',
                          backgroundColor: selectedPOI?.poiId === poi.poiId ? '#2a4a2a' : '#2a2a2a',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: selectedPOI?.poiId === poi.poiId ? '2px solid #4CAF50' : '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedPOI?.poiId !== poi.poiId) {
                            e.currentTarget.style.backgroundColor = '#353535';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedPOI?.poiId !== poi.poiId) {
                            e.currentTarget.style.backgroundColor = '#2a2a2a';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ color: 'white', margin: 0, marginBottom: '5px' }}>{poi.name}</h4>
                            {poi.district && (
                              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                                📍 {poi.district}
                              </p>
                            )}
                          </div>

                          {poi.type === 'residence' && (
                            <div style={{ textAlign: 'right' }}>
                              {poi.available ? (
                                <span style={{ color: '#4CAF50', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  {poi.price} gold
                                </span>
                              ) : (
                                <span style={{ color: '#888', fontSize: '0.85rem' }}>
                                  Owned by {poi.owner}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Location Details */}
            {selectedPOI && (
              <div style={{
                width: '40%',
                borderLeft: '2px solid #444',
                backgroundColor: '#0d0d0d',
                padding: '30px',
                overflowY: 'auto'
              }}>
                <button
                  onClick={() => onSelectPOI(null!)}
                  style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to List
                </button>

                <div style={{ color: 'white' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{POI_ICONS[selectedPOI.type] || '📍'}</span>
                    {selectedPOI.name}
                  </h2>

                  {selectedPOI.district && (
                    <p style={{ color: '#4CAF50', fontSize: '1.1rem', marginBottom: '20px' }}>
                      {selectedPOI.district}
                    </p>
                  )}

                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#ccc', marginBottom: '30px' }}>
                    {selectedPOI.description}
                  </p>

                  {renderActions(selectedPOI, onPurchaseProperty)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const actionButtonStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#444',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  textAlign: 'left',
  transition: 'background-color 0.2s'
};

function renderActions(poi: any, onPurchaseProperty: (poi: any) => void) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#4CAF50' }}>Available Actions</h3>

      {poi.type === 'tavern' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={actionButtonStyle}>🍺 Order a Drink (Coming Soon)</button>
          <button style={actionButtonStyle}>💬 Talk to Patrons (Coming Soon)</button>
          <button style={actionButtonStyle}>📜 Check Quest Board (Coming Soon)</button>
        </div>
      )}

      {poi.type === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={actionButtonStyle}>🛒 Browse Wares (Coming Soon)</button>
          <button style={actionButtonStyle}>💰 Sell Items (Coming Soon)</button>
        </div>
      )}

      {poi.type === 'temple' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={actionButtonStyle}>🙏 Pray (Coming Soon)</button>
          <button style={actionButtonStyle}>❤️ Receive Healing (Coming Soon)</button>
          <button style={actionButtonStyle}>💫 Request Blessing (Coming Soon)</button>
        </div>
      )}

      {poi.type === 'castle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={actionButtonStyle}>👑 Seek Audience (Coming Soon)</button>
          <button style={actionButtonStyle}>📜 Check Royal Quests (Coming Soon)</button>
        </div>
      )}

      {poi.type === 'guild' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={actionButtonStyle}>🤝 Join Guild (Coming Soon)</button>
          <button style={actionButtonStyle}>📋 Accept Contracts (Coming Soon)</button>
        </div>
      )}

      {poi.type === 'residence' && poi.available && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '6px', marginBottom: '10px' }}>
            <p style={{ margin: 0, color: '#ccc' }}>
              <strong style={{ color: 'white' }}>Price:</strong> {poi.price} gold
            </p>
            <p style={{ margin: '10px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
              Purchasing this property will make it your permanent residence.
            </p>
          </div>
          <button
            onClick={() => onPurchaseProperty(poi)}
            style={{
              ...actionButtonStyle,
              backgroundColor: '#4CAF50',
              fontWeight: 'bold'
            }}
          >
            💰 Purchase Property
          </button>
        </div>
      )}

      {poi.type === 'residence' && !poi.available && (
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          This property is owned by {poi.owner}
        </p>
      )}

      {!['tavern', 'shop', 'temple', 'castle', 'guild', 'residence'].includes(poi.type) && (
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          More interactions coming soon...
        </p>
      )}
    </div>
  );
}
