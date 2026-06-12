export default function Verified() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#36393f', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <h1 style={{ color: '#57F287' }}>Verified!</h1>
        <p style={{ color: '#b9bbbe', fontSize: '18px' }}>You have been verified and your role has been assigned.</p>
        <p style={{ color: '#b9bbbe' }}>You can close this tab and go back to Discord.</p>
      </div>
    </div>
  );
}
