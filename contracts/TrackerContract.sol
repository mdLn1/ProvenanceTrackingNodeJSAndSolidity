pragma solidity >=0.5.0;
import {ProvenanceContract} from "./ProvenanceContract.sol";


contract TrackerContract {
    enum RoleType {Manufacturer, Seller, Distributor}
    // admin, can be contract deployer
    address admin;
    // registered users
    mapping(address => User) private authorizedUsers;
    mapping(string => address) private usersByName;
    uint256 private productId = 1;
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only an admin can perform this action");
        _;
    }

    event ProvenanceContractDeployed(
        address indexed _newContractAddress,
        address indexed _contractCreator,
        uint256 indexed _productId,
        string _manufacturerName,
        string _productName,
        string _linkToMerch,
        string _dateAdded
    );

    event AddBranchEvent(
        address indexed _partyAddress,
        string _companyName,
        string _branchName,
        string _latitudeLocation,
        string _longitudeLocation
    );

    struct User {
        string companyName;
        string password;
        bool exists;
        bool disabled;
        RoleType role;
    }

    constructor() public {
        admin = msg.sender;
    }

    function loginUser(string memory _name, string memory _password)
        public
        view
        returns (bool)
    {
        if (
            keccak256(bytes(authorizedUsers[usersByName[_name]].password)) ==
            keccak256(bytes(_password))
        ) {
            return true;
        }
        return false;
    }

    function createProvenanceContract(
        address _seller,
        string memory _productName,
        string memory _linkToMerch,
        string memory _latitudeLocation,
        string memory _longitudeLocation,
        string memory _dateAdded
    ) public returns (address newContract) {
        require(
            authorizedUsers[msg.sender].role == RoleType.Manufacturer,
            "You are not authorized to create a contract"
        );
        newContract = address(
            new ProvenanceContract(
                msg.sender,
                _seller,
                productId,
                _productName,
                _linkToMerch,
                authorizedUsers[msg.sender].companyName,
                _latitudeLocation,
                _longitudeLocation,
                _dateAdded
            )
        );
        emit ProvenanceContractDeployed(
            newContract,
            msg.sender,
            productId,
            authorizedUsers[msg.sender].companyName,
            _productName,
            _linkToMerch,
            _dateAdded
        );
        productId = productId + 1;
    }

    function addUser(
        address _accountAddress,
        string memory _name,
        string memory _password,
        string memory _role
    ) public onlyAdmin {
        RoleType assignedRole;
        if (keccak256(bytes(_role)) == keccak256(bytes("seller"))) {
            assignedRole = RoleType.Seller;
        } else if (keccak256(bytes(_role)) == keccak256(bytes("distributor"))) {
            assignedRole = RoleType.Distributor;
        } else {
            assignedRole = RoleType.Manufacturer;
        }
        authorizedUsers[_accountAddress] = User(
            _name,
            _password,
            true,
            false,
            assignedRole
        );
        usersByName[_name] = _accountAddress;
    }

    function addBranch(
        string memory _branchName,
        string memory _latitudeLocation,
        string memory _longitudeLocation
    ) public {
        emit AddBranchEvent(
            msg.sender,
            authorizedUsers[msg.sender].companyName,
            _branchName,
            _latitudeLocation,
            _longitudeLocation
        );
    }

    function transferProduct(
        address _newParty,
        address _contract,
        string memory _latitudeLocation,
        string memory _longitudeLocation,
        string memory _dateTransferred
    ) public {
        require(
            authorizedUsers[_newParty].exists,
            "User does not exist, please do not make transfer"
        );
        ProvenanceContract(_contract).transferProduct(
            msg.sender,
            _newParty,
            authorizedUsers[_newParty].companyName,
            _latitudeLocation,
            _longitudeLocation,
            _dateTransferred
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
