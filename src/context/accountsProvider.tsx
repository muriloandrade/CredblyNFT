import { AccountBalance, AccountBalanceQuery, AccountCreateTransaction, AccountId, AccountInfoQuery, Client, Hbar, PrivateKey } from "@hashgraph/sdk";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { logError, logTransactionLink } from "../utils/general";

export interface AccountType {
	name: string;
	id?: AccountId;
	address?: string;
	privateKey?: PrivateKey;
	privateKeyECDSA?: string;
	balance?: string;
	icon: string;
}

type AccountsContextType = {
	accounts?: AccountType[];
	setAccounts?: (accounts: AccountType[]) => void;
	selectedAccount?: AccountType;
	setSelectedAccount?: (acc: AccountType) => void;
	generateAccountsFcn?: (userAccountId: string, userPrivateKey: string) => void;
	client?: Client;
	isLoading?: boolean;
	updateBalances?: () => void;
}

export const AccountsContext = React.createContext<AccountsContextType>({});

function AccountsProvider(props: any) {
	const [isLoading, setIsLoading] = useState(false);

	const [accounts, setAccounts] = useState<AccountType[]>(new Array<AccountType>());
	const [selectedAccount, setSelectedAccount] = useState<AccountType>();
	const [client, setClient] = useState<Client>();

	const prevAccounts = useRef(accounts);

	async function generateAccountsFcn(userAccountId: string, userPrivateKey: string) {
		
		let accts;
		accts = localStorage.getItem('accounts')
		if (!accts) {
			
			const client = Client.forTestnet().setOperator(userAccountId, userPrivateKey);

			accts = new Array<AccountType>();
			accts.push({
				name: "Brand A",
				icon: "factory"
			})
			accts.push({
				name: "Brand B",
				icon: "factory"
			})
			accts.push({
				name: "Retailer",
				icon: "storefront"
			})
			accts.push({
				name: "Customer",
				icon: "person"
			})


			try {
				setIsLoading(true)
				let index = 0;
				for (const acct of accts) {

					console.log(`Creating ${acct.name} account...`);

					//120ℏ for Manufacturers, 20ℏ for Retailer and Customer
					const initBalance = index++ > 1 ? 20 : 120; 

					const pvKey = PrivateKey.generateECDSA();

					const transaction = await new AccountCreateTransaction()
						.setInitialBalance(new Hbar(initBalance))
						.setKey(pvKey.publicKey)
						.setAlias(pvKey.publicKey.toEvmAddress())
						.execute(client)
					logTransactionLink('accountCreate', transaction!.transactionId);

					const receipt = await transaction.getReceipt(client);

					const status = receipt.status;
					const id = receipt.accountId;

					if (status?.toString() == "SUCCESS") {

						const accountInfo = await new AccountInfoQuery()
							.setAccountId(id as AccountId)
							.execute(client);
						const addr = `0x${accountInfo.contractAccountId}`

						acct.id = id as AccountId;
						acct.address = addr as string;
						acct.privateKey = pvKey;
						acct.privateKeyECDSA = pvKey.toStringDer();
						acct.balance = "";

						toast.success(`${acct.name} successfully created`)
						console.log(`${acct.name} account successfully created`, acct)
					}
					else {
						throw new Error(`Transaction failed: ${status}`)
					}
				}
			} catch (error) {
				logError(error);
			} finally {
				setIsLoading(false);
			}
			localStorage.setItem('accounts', JSON.stringify(accts));
		}
		else {
			console.log('getting accounts from cache...')
			accts = JSON.parse(accts);
			// recreate AccountId and PrivateKey objects
			accts = accts.map((acc: AccountType) => {
				return { ...acc, id: new AccountId(acc.id as AccountId), privateKey: PrivateKey.fromStringECDSA(acc.privateKeyECDSA!) }
			})
		}
		setAccounts(accts)
		setSelectedAccount(accts[0])
		console.log('done')
	}

	useEffect(() => {
		if (prevAccounts.current !== accounts) {
			prevAccounts.current = accounts;
			return
		}
		updateBalances()
	});

	useEffect(() => {
		selectedAccount && configureClient(selectedAccount)
	}, [selectedAccount])


	function configureClient(acc: AccountType) {
		// Configure client for Testnet
		const operatorId = acc.id;
		const operatorKey = acc.privateKey;
		const cl = operatorId && operatorKey && Client.forTestnet().setOperator(operatorId, operatorKey);
		cl!.setMirrorNetwork(['testnet.mirrornode.hedera.com:443']);
		setClient(cl);
	}

	function updateBalances() {
		let promises: Promise<AccountBalance>[] = [];
		if (client) {
			accounts.forEach(acc => {
				const balance = new AccountBalanceQuery()
					.setAccountId(acc.id!)
					.execute(client);
				promises.push(balance);
			})
		}
		if (promises.length > 0) {
			Promise.all(promises).then((result) => {
				setAccounts(accounts?.map((acc, index) => {
					return { ...acc, balance: result[index].hbars.toString() };
				}))
			});
		}
	}

	return (
		<AccountsContext.Provider value={{ accounts, setAccounts, selectedAccount, setSelectedAccount, client, generateAccountsFcn, isLoading, updateBalances }}>
			{props.children}
		</AccountsContext.Provider>
	)
}

export default AccountsProvider;
