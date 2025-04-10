import { Buffer } from 'buffer'
window.Buffer = Buffer

import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  getAccount
} from '@solana/spl-token'

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)

  useEffect(() => {
    const checkWalletAndFetchBalance = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          try {
            // Connect to Phantom wallet
            await provider.connect()
            const walletPublicKey = provider.publicKey
            setWallet(walletPublicKey.toString())

            // Connect to Solana RPC and get associated token account
            const connection = new Connection(RPC_URL)
            const ata = await getAssociatedTokenAddress(
              LIKE_MINT,
              walletPublicKey
            )

            console.log('Wallet:', walletPublicKey.toBase58())
            console.log('ATA:', ata.toBase58())

            // Fetch token account and display balance
            const account = await getAccount(connection, ata)
            const amount = Number(account.amount) / 1_000_000_000 // adjust for decimals
            setLikeBalance(amount)
          } catch (err) {
            console.error('Error fetching LIKE balance:', err)
            setLikeBalance(0)
          }
        }
      }
    }

    checkWalletAndFetchBalance()
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
