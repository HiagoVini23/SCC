import sys
import subprocess
import re
import os

capa_script = ".\\capa.exe"
truffle_directory = "..\\truffle-contract"

filename = input("Enter the path of the binary file: ")
private_key = input("Enter the private key of the owner: ")

# Validate inputs
if not filename or not os.path.isfile(filename):
    print("Error: The specified file does not exist.")
    sys.exit(1)

if not private_key:
    print("Error: Private key cannot be empty.")
    sys.exit(1)

print(f"\nProcessing file: {filename} \n")
os.environ['PRIVATE_KEY'] = private_key
capa_command = [capa_script, "-r", ".\\capa-rules-7.1.0", filename]

try:
    # Use subprocess.run to execute the system script/command
    result = subprocess.run(capa_command, shell=False, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Decode the output using 'utf-8'
    stdout_decoded = result.stdout.decode('utf-8', errors='replace')
    stderr_decoded = result.stderr.decode('utf-8', errors='replace')

    # Extract the SHA256
    sha256_match = re.search(r"sha256\s+\│\s+([a-f0-9]{64})", stdout_decoded)
    sha256 = sha256_match.group(1) if sha256_match else None

    # Flag to start capturing capabilities after finding the "Capability" section
    capabilities = []
    capture = False

    for line in stdout_decoded.splitlines():
        # Check if the "Capability" section starts
        if "Capability" in line:
            capture = True
            continue

        # Capture capabilities
        if capture:
            match = re.search(r"│\s*([^\│]+?)\s*│", line)
            if match:
                capability = match.group(1).strip()
                # Stop capturing if an empty capability is found (end of section)
                if capability:
                    capabilities.append(capability)
                else:
                    break
                
    # Set the environment variables
    os.environ['hash'] = sha256 if sha256 else ''
    os.environ['capabilities'] = ','.join(capabilities)

    # Change to the directory containing the Truffle project
    os.chdir(truffle_directory)

    # Run the Truffle deploy command
    npx_path = 'C:\\Program Files\\nodejs\\npx.cmd'
    deploy_command = [npx_path, 'truffle', 'deploy']
    subprocess.run(deploy_command, check=True)

except subprocess.CalledProcessError as e:
    print(f"Error: {e}")

print("\nProcessing complete.")