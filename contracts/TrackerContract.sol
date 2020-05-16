pragma solidity >=0.5.0;
import {ProvenanceContract} from "./ProvenanceContract.sol";


contract TrackerContract {
    enum RoleType {Manufacturer, Seller, Distributor}
    // registered users
    mapping(address => User) private authorizedUsers;
    mapping(string => address) private usersByName;
    uint256 private productId = 1;

    // add also state?
    event TransitEvent(
        address indexed transferredTo,
        uint256 indexed productId,
        string companyName,
        string productName,
        string latitudeLocation,
        string longitudeLocation,
        string dateTransferred,
        uint productState
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
        string role,
        bool companyDisabled,
        string dateAdded
    );

    struct User {
        string companyName;
        bool exists;
        bool disabled;
        RoleType role;
    }

    constructor(
        string memory _name,
        string memory _role,
        string memory _dateAdded
    ) public {
        RoleType assignedRole;
        if (keccak256(bytes(_role)) == keccak256(bytes("seller"))) {
            assignedRole = RoleType.Seller;
        } else if (keccak256(bytes(_role)) == keccak256(bytes("distributor"))) {
            assignedRole = RoleType.Distributor;
        } else {
            assignedRole = RoleType.Manufacturer;
        }
        authorizedUsers[msg.sender] = User(
            _name,
            true,
            false,
            assignedRole
        );
        usersByName[_name] = msg.sender;
        emit UserEvent(msg.sender, _name, _role, false, _dateAdded);
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
        require(
            authorizedUsers[_seller].exists == true &&
                authorizedUsers[_seller].role == RoleType.Seller,
            "The seller account provided is not a seller"
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
            _dateAdded,
            0
        );
        newProductId = productId;
        productId = productId + 1;
    }

    function addUser(
        address _accountAddress,
        string memory _name,
        string memory _role,
        string memory _dateAdded
    ) public {
        require(
            authorizedUsers[msg.sender].exists == true,
            "You are not allowed to add accounts"
        );
        require(
            authorizedUsers[_accountAddress].exists == false,
            "The address provided is already linked to an account"
        );
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
            true,
            false,
            assignedRole
        );
        usersByName[_name] = _accountAddress;
        emit UserEvent(_accountAddress, _name, _role, false, _dateAdded);
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
        uint result = ProvenanceContract(_contract).transferProduct(
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
                _dateTransferred,
                result
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

    function getProductCurrentOwner(address _contract)
        public
        view
        returns (address)
    {
        return ProvenanceContract(_contract).getCurrentOwner();
    }

    function getProductState(address _contract) public view returns(uint){
        return ProvenanceContract(_contract).getProductState();
    }
}
