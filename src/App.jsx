import { useEffect, useState } from 'react'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { Buffer } from 'buffer'

window.Buffer = Buffer

const RPC_URL = 'https://api.devnet.solana.com'
const LIKE_MINT = new PublicKey('3Nx5eK8sZd8Sqa6fVqkwEP3j9Dt2PwkqctGBYHTaeyQT')

// Step 4: Load secret key from .env
const secret = import.meta.env.VITE_MASTER_SECRET
let masterWallet

if (!secret) {
  console.error("🚨 VITE_MASTER_SECRET is undefined. Check your .env and Vite config.")
} else {
  try {
    const masterSecretKey = JSON.parse(secret)
    masterWallet = Keypair.fromSecretKey(Uint8Array.from(masterSecretKey))
    console.log("✅ Master wallet loaded.")
  } catch (err) {
    console.error("❌ Failed to parse VITE_MASTER_SECRET:", err)
  }
}

function App() {
  const [wallet, setWallet] = useState(null)
  const [likeBalance, setLikeBalance] = useState(null)

  useEffect(() => {
    const checkWalletAndFetchBalance = async () => {
      if ('solana' in window) {
        const provider = window.solana
        if (provider.isPhantom) {
          try {
            await provider.connect()
            const walletPublicKey = provider.publicKey
            setWallet(walletPublicKey.toString())

            const connection = new Connection(RPC_URL)
            const ata = await getAssociatedTokenAddress(
              LIKE_MINT,
              walletPublicKey
            )

            const account = await getAccount(connection, ata)
            const amount = Number(account.amount) / 1_000_000_000
            setLikeBalance(amount)
          } catch (err) {
            console.error('Error fetching balance:', err)
            setLikeBalance(0)
          }
        }
      }
    }

    checkWalletAndFetchBalance()
  }, [])

  const sendLikeTokens = async () => {
    if (!wallet || !masterWallet) return

    try {
      const connection = new Connection(RPC_URL)
      const recipientPublicKey = new PublicKey(wallet)

      const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        masterWallet,
        LIKE_MINT,
        masterWallet.publicKey
      )

      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        masterWallet,
        LIKE_MINT,
        recipientPublicKey
      )

      const transferIx = createTransferInstruction(
        senderTokenAccount.address,
        recipientTokenAccount.address,
        masterWallet.publicKey,
        100_000_000 // 100 LIKE (in lamports)
      )

      const transaction = await connection.sendTransaction(
        {
          feePayer: masterWallet.publicKey,
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
          instructions: [transferIx],
          signatures: []
        },
        [masterWallet]
      )

      console.log("✅ Transfer signature:", transaction)
    } catch (error) {
      console.error("❌ Transfer failed:", error)
    }
  }

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
      <p><strong>Wallet:</strong> {wallet || 'Not connected'}</p>
      <p><strong>LIKE Balance:</strong> {likeBalance !== null ? likeBalance : 'Loading...'}</p>

      {wallet && (
        <button
          onClick={sendLikeTokens}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px',
            fontWeight: 'bold'
          }}
        >
          Get 100 LIKE
        </button>
      )}
    </div>
  )
}

export default App
