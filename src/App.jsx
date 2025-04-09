import { getAssociatedTokenAddress } from '@solana/spl-token'
import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'


const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')
const RPC_URL = 'https://api.devnet.solana.com'

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)

  useEffect(() => {
    const checkWallet = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          await provider.connect()
          setWallet(provider.publicKey.toString())

          const conn = new Connection(RPC_URL)
          const ata = await getAssociatedTokenAddress(LIKE_MINT, provider.publicKey)

          try {
            const accountInfo = await conn.getParsedAccountInfo(ata)
            const parsed = accountInfo.value?.data?.parsed
            const balance = parsed?.info?.tokenAmount?.uiAmount

            setLikeBalance(balance ?? 0)
          } catch (e) {
            console.error('Error getting token balance:', e)
            setLikeBalance(0)
          }
        }
      }
    }

    checkWallet()
  }, [])

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
      backgroundColor: '#111',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>🚀 Like Coin Dashboard</h1>
      <p>Wallet: {wallet || 'Not connected'}</p>
      <p>LIKE Balance: {likeBalance !== null ? likeBalance : 'Loading...'}</p>
    </div>
  )
}

export default App
