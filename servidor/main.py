from web3 import Web3
from web3.middleware import geth_poa_middleware
from dotenv import load_dotenv
import os
from contractABI import contract_abi

load_dotenv()

# URL do provedor da rede Sepolia
provider_url = os.getenv("provider_url")

# Criar uma instância do web3.py
web3 = Web3(Web3.HTTPProvider(provider_url))

# Middleware necessário para redes Ethereum PoA (se necessário)
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

# Chave privada da sua conta Ethereum (exemplo, NÃO use uma chave privada real assim)
private_key = os.getenv("private_key_wallet")

# Endereço da sua conta Ethereum
wallet_address = os.getenv("wallet_address")

# Definir o endereço e a ABI do contrato inteligente SCC
contract_scc = os.getenv("contract")

# Criar uma instância do contrato
contract = web3.eth.contract(address=contract_scc, abi=contract_abi)

# Converter a string hexadecimal em bytes32
key_hex_string = '0x2234567890abcdef1234567890aacdef1204267890abcdef1234267890abcdef'
key_bytes = Web3.to_bytes(hexstr=key_hex_string)

# Exemplo de função que envia uma transação assinada
def registerKey():
    nonce = web3.eth.get_transaction_count(wallet_address)
    function = contract.functions.registerKey(key_bytes)
    transaction = function.build_transaction({
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei'),
        'nonce': nonce,
    })
    signed_txn = web3.eth.account.sign_transaction(transaction, private_key=private_key)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Transação enviada: {tx_hash.hex()}")

def reportPendingSoftwareBehavior(behaviors, windows_key):
    nonce = web3.eth.get_transaction_count(wallet_address)
    function = contract.functions.reportPendingSoftwareBehavior(behaviors, windows_key)
    transaction = function.build_transaction({
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei'),
        'nonce': nonce,
    })
    signed_txn = web3.eth.account.sign_transaction(transaction, private_key=private_key)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Transação enviada: {tx_hash.hex()}")

def voteOnPendingReport():
    nonce = web3.eth.get_transaction_count(wallet_address)
    function = contract.functions.voteOnPendingReport(True, 1)
    transaction = function.build_transaction({
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei'),
        'nonce': nonce,
    })
    signed_txn = web3.eth.account.sign_transaction(transaction, private_key=private_key)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Transação enviada: {tx_hash.hex()}")

def authorizeUser():
    nonce = web3.eth.get_transaction_count(wallet_address)
    function = contract.functions.authorizeUser(key_bytes)
    transaction = function.build_transaction({
        'gas': 2000000,
        'gasPrice': web3.to_wei('50', 'gwei'),
        'nonce': nonce,
    })
    signed_txn = web3.eth.account.sign_transaction(transaction, private_key=private_key)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Transação enviada: {tx_hash.hex()}")

def retrieveReportOverview():
    function = contract.functions.retrieveReportOverview()
    result = function.call()
    return result


behaviors = ["Behavior A", "Behavior B", "Behavior C"]
voteOnPendingReport()