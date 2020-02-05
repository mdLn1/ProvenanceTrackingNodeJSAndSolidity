pragma solidity >=0.5.0;
import {ProvenanceContract} from "./ProvenanceContract.sol";

contract TrackerContract {
    // admin, can be contract deployer
    address admin;
    // registered users
    mapping(address => User) private authorizedUsers;
    address[] public users;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only an admin can perform this action");
        _;
    }

    event ProvenanceContractDeployed(
        address indexed _newContractAddress,
        address indexed _contractCreator,
        string _productName
    );

    struct User {
        string name;
        string location;
        string role;
        bool exists;
        address[] products;
        bool isManufacturer;
    }

    constructor() public {
        admin = msg.sender;
    }

    function createProvenanceContract(
        address _seller,
        string memory _productName
    ) public returns (address newContract) {
        require(
            authorizedUsers[msg.sender].isManufacturer,
            "You are not authorized to create a contract"
        );
        newContract = address(
            new ProvenanceContract(msg.sender, _seller, _productName)
        );
        authorizedUsers[msg.sender].products.push(newContract);
        emit ProvenanceContractDeployed(newContract, msg.sender, _productName);
    }

    function addManufacturer(
        address _accountAddress,
        string memory _name,
        string memory _location
    ) public onlyAdmin {
        authorizedUsers[_accountAddress] = User(
            _name,
            _location,
            "Manufacturer",
            true,
            new address[](0),
            true
        );
        users.push(_accountAddress);
    }

    function addUser(
        address _accountAddress,
        string memory _name,
        string memory _location,
        string memory _role
    ) public onlyAdmin {
        authorizedUsers[_accountAddress] = User(
            _name,
            _location,
            _role,
            true,
            new address[](0),
            false
        );
        users.push(_accountAddress);
    }

    function getAllProducts() public view returns(address[] memory) {
        return authorizedUsers[msg.sender].products;
    }

    function getProductState(address _deployedContractAddress)
        public
        view
        returns (string memory)
    {
        return ProvenanceContract(_deployedContractAddress).getProductStatus();
    }

    function getProductName(address _deployedContractAddress)
        public
        view
        returns (string memory)
    {
        return ProvenanceContract(_deployedContractAddress).getProductDetails();
    }

    function transfer(address _newParty, address _contract) public {
        require(
            authorizedUsers[_newParty].exists,
            "User does not exist, please do not make transfer"
        );
        ProvenanceContract(_contract).transferProduct(
            msg.sender,
            _newParty,
            authorizedUsers[_newParty].name
        );
    }

    function returnProduct(address _contract, string memory _buyer) public {
        ProvenanceContract(_contract).returnProduct(msg.sender, _buyer);
    }

    function resellProduct(
        address _contract,
        string memory _buyer,
        string memory _newBuyer
    ) public {
        ProvenanceContract(_contract).resellProduct(
            msg.sender,
            _buyer,
            _newBuyer
        );
    }

    function sellProduct(address _contract, string memory _buyer) public {
        ProvenanceContract(_contract).sellProduct(msg.sender, _buyer);
    }

    function changeProductDetails(address _contract, string memory _productName)
        public
    {
        ProvenanceContract(_contract).editProduct(msg.sender, _productName);
    }

    function getProductCurrentOwner(address _contract)
        public
        view
        returns (address)
    {
        return ProvenanceContract(_contract).getCurrentOwner();
    }
}
