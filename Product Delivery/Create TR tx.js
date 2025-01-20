(async () => {
	const PIIsdk = require("@notabene/pii-sdk").default;

	//Initialize the Notabene encryption toolset
	const toolset = new PIIsdk({
		clientId: "<NOTABENE CLIENT ID>",
		clientSecret: "<NOTABENE CLIENT SECRET>",
		audience: "https://pii.notabene.id", // test env: "https://pii.notabene.dev"
		authURL: "https://auth.notabene.id",
		piiURL: "https://pii.notabene.id" // test env: "https://pii.notabene.dev"
	});

	const originatorVASPdid = "<YOUR VASP DID>"
	const beneficiaryVASPdid = "<COUNTERPARTY VASP DID>"

	const counterpartyDIDKey = "<COUNTERPARTY VASP PUBLIC KEY>"

	const keypair = {
		"did": "<YOUR VASPS PUBLIC KEY>",
		"keys": [{
			"privateKeyHex": "<YOUR VASPS PRIVATE KEY>"
		}]
	}

	const pii = {
		originator: {
			originatorPersons: [{
				naturalPerson: {
					name: [{
						nameIdentifier: [{
							primaryIdentifier: 'Patterson',
							secondaryIdentifier: 'Tristan',
						}, ],
					}, ],
					geographicAddress: [{
						streetName: 'Chicago Ave',
						townName: 'Chicago',
						country: 'US',
						buildingNumber: '10',
						postCode: '123456',
					}, ],
					nationalIdentification: {
						countryOfIssue: 'US',
						nationalIdentifier: '987654321',
						nationalIdentifierType: 'DRLC',
					},
				},
			}, ],
			accountNumber: [
				'77777777777777777',
			],
		},
		beneficiary: {
			beneficiaryPersons: [{
				naturalPerson: {
					name: [{
						nameIdentifier: [{
							primaryIdentifier: 'Hernandez',
							secondaryIdentifier: 'Leah',
						}, ],
					}, ],
				},
			}, ],
			accountNumber: [
				'1111111111111',
			],
		}
	};

	// Encrypt PII
	const encrypted_pii = await toolset.generatePIIField({
		pii: pii,
		originatorVASPdid: originatorVASPdid,
		beneficiaryVASPdid: beneficiaryVASPdid,
		counterpartyDIDKey: counterpartyDIDKey,
		keypair: keypair,
		senderDIDKey: keypair.did,
		encryptionMethod: 2 // 1 for end-to-end, 2 for hybrid
	});

	// Add the travel rule message to your Fireblocks transaction body

	const {
		FireblocksSDK
	} = require('fireblocks-sdk');

	const apiSecret = "<FIREBLOCKS API SECRET>";
	const apiKey = "<FIREBLOCKS API KEY>";
	const baseUrl = "https://api.fireblocks.io";
	const fireblocks = new FireblocksSDK(apiSecret, apiKey, baseUrl);

	const body = {
		"assetId": "BTC_TEST",
		"source": {
			"type": "VAULT_ACCOUNT",
			"id": "1",
			"virtualId": "BTC_TEST"
		},
		"destination": {
			"type": "ONE_TIME_ADDRESS",
			"oneTimeAddress": {
				"address": "<DESTINATION BLOCKCHAIN ADDRESS>"
			},
			"virtualId": "BTC_TEST"
		},
		"operation": "TRANSFER",
		"failOnLowFee": false,
		"amount": "0.0002",
		"note": "A travel rule compliant transaction created by fireblocks API",
		"travelRuleMessage": {
			"originatorVASPdid": originatorVASPdid,
			"beneficiaryVASPdid": beneficiaryVASPdid,
			"originator": encrypted_pii.originator,
			"beneficiary": encrypted_pii.beneficiary
		}
	}

	const resp = await fireblocks.apiClient.issuePostRequest(`/v1/transactions`, body, null);

})();