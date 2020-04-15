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
    // add also state?
    event TransitEvent(
        address indexed transferredTo,
        uint256 indexed productId,
        string companyName,
        string productName,
        string latitudeLocation,
        string longitudeLocation,
        string dateTransferred
    );

    event ProductEvent(
        address indexed productContractAddress,
        address indexed manufacturerAddress,
        uint256 indexed productId,
        string manufacturerName,
        string productName,
        string linkToMerch,
        string dateAdded
    );

    event BranchEvent(
        address indexed companyAddress,
        string companyName,
        string branchName,
        string latitudeLocation,
        string longitudeLocation,
        string dateAdded
    );

    event UserEvent(
        address indexed userAddress,
        string companyName,
        bool companyDisabled,
        string dateAdded
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
        returns (address companyAddress, bool disabled, RoleType role)
    {
        User memory userToLogin = authorizedUsers[usersByName[_name]];
        require(
            keccak256(bytes(userToLogin.password)) ==
                keccak256(bytes(_password)),
            "Invalid login attempt"
        );
        companyAddress = usersByName[_name];
        disabled = userToLogin.disabled;
        role = userToLogin.role;
    }

    function createProvenanceContract(
        address _seller,
        string memory _productName,
        string memory _linkToMerch,
        string memory _latitudeLocation,
        string memory _longitudeLocation,
        string memory _dateAdded
    ) public returns (uint256 newProductId, string memory company) {
        require(
            authorizedUsers[msg.sender].role == RoleType.Manufacturer,
            "You are not authorized to create a contract"
        );
        company = authorizedUsers[msg.sender].companyName;
        address newContract = address(
            new ProvenanceContract(
                msg.sender,
                _seller,
                productId,
                _productName,
                _linkToMerch
            )
        );
        emit ProductEvent(
            newContract,
            msg.sender,
            productId,
            company,
            _productName,
            _linkToMerch,
            _dateAdded
        );
        emit TransitEvent(
            msg.sender,
            productId,
            company,
            _productName,
            _latitudeLocation,
            _longitudeLocation,
            _dateAdded
        );
        newProductId = productId;
        productId = productId + 1;
    }

    function addUser(
        address _accountAddress,
        string memory _name,
        string memory _password,
        string memory _role,
        string memory _dateAdded
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
        emit UserEvent(_accountAddress, _name, false, _dateAdded);
    }

    function addBranch(
        string memory _branchName,
        string memory _latitudeLocation,
        string memory _longitudeLocation,
        string memory _dateAdded
    ) public {
        emit BranchEvent(
            msg.sender,
            authorizedUsers[msg.sender].companyName,
            _branchName,
            _latitudeLocation,
            _longitudeLocation,
            _dateAdded
        );
    }

    function transferProduct(
        address _newParty,
        address _contract,
        uint256 _productId,
        string memory productName,
        string memory _latitudeLocation,
        string memory _longitudeLocation,
        string memory _dateTransferred
    ) public {
        require(
            authorizedUsers[_newParty].exists,
            "User does not exist, please do not make transfer"
        );
        string memory company = authorizedUsers[_newParty].companyName;
        uint256 result = ProvenanceContract(_contract).transferProduct(
            msg.sender,
            _newParty,
            company
        );
        if (result != 0)
            emit TransitEvent(
                _newParty,
                _productId,
                company,
                productName,
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
