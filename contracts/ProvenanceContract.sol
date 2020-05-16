pragma solidity >=0.5.0;


contract ProvenanceContract {
    //Set of States
    enum StateType {Created, InTransit, InShop, Sold}

    //List of properties
    StateType private State;
    address private manufacturer;
    address private seller;
    address private currentHolder;
    string private linkToMerch = "";
    string private buyer = "";
    uint256 private productId;
    string private productName = "";


    modifier onlyManufacturer(address sender) {
        require(
            sender == manufacturer,
            "Only Manufacturers can perform this action"
        );
        _;
    }

    modifier onlyMandS(address sender) {
        require(
            sender == manufacturer || sender == seller,
            "Only original manufacturer/seller can perform this action"
        );
        _;
    }

    modifier onlySeller(address sender) {
        require(sender == seller, "Only original seller can perform this action");
        _;
    }

    modifier onlyCurrentHolder(address sender) {
        require(
            sender == currentHolder,
            "Only current holder of the product can perform this action"
        );
        _;
    }

    constructor(
        address _sender,
        address _seller,
        uint256 _productId,
        string memory _productName,
        string memory _linkToMerch
    ) public {
        require(
            _seller != _sender,
            "Seller must be different from Manufacturer"
        );
        productName = _productName;
        manufacturer = _sender;
        currentHolder = manufacturer;
        productId = _productId;
        seller = _seller;
        State = StateType.Created;
        linkToMerch = _linkToMerch;
    }

    function getCurrentOwner() public view returns (address) {
        return currentHolder;
    }

    function getProductState() public view returns (uint) {
        if(State == StateType.Created) {
            return 0;
        } else if (State == StateType.InTransit) {
            return 1;
        } else if (State == StateType.InShop) {
            return 2;
        }
        return 3;
    }

    function returnProduct(address _sender, string memory _buyer)
        public
        onlySeller(_sender)
        returns (uint)
    {
        require(
            keccak256(bytes(buyer)) == keccak256(bytes(_buyer)),
            "Operation failed, buyer entered invalid secure key"
        );
        State = StateType.InShop;
        buyer = "";
    }

    function resellProduct(
        address _sender,
        string memory _buyer,
        string memory _newBuyer
    ) public onlySeller(_sender) {
        require(
            keccak256(bytes(buyer)) == keccak256(bytes(_buyer)),
            "Operation failed, buyer entered invalid secure key"
        );
        require(
            bytes(_newBuyer).length > 8,
            "The new owner must enter a secure key"
        );
        buyer = _newBuyer;
    }

    function sellProduct(address _sender, string memory _buyer)
        public
        onlySeller(_sender)
    {
        require(
            State == StateType.InShop,
            "Product must be inside the shop to sell it"
        );
        require(bytes(_buyer).length > 8, "The customer must enter a secure key");
        buyer = _buyer;
    }
// 0 - code finished execution, someone else than seller tried transferring product?
// 1 - item transferred
// 2 - item reached the seller
    function transferProduct(
        address _sender,
        address _newParty,
        string memory _nameNewParty
    ) public onlyCurrentHolder(_sender) returns(uint) {
        require(
            State != StateType.Sold,
            "Item is sold already, contact seller"
        );
        if (manufacturer == _sender) {
            State = StateType.InTransit;
        }
        if (_newParty == seller) {
            State = StateType.InShop;
            currentHolder = _newParty;
        }
        if (State == StateType.InTransit) {
            require(
                bytes(_nameNewParty).length > 0,
                "The new party must have a name"
            );
            currentHolder = _newParty;
        }
        if(State == StateType.InTransit) {
            return 1;
        } else if (State == StateType.InShop) {
            return 2;
        }
        return 0;
    }

    // Utility
    function concat(string memory _base, string memory _value)
        internal
        pure
        returns (string memory)
    {
        bytes memory _baseBytes = bytes(_base);
        bytes memory _valueBytes = bytes(_value);
        string memory _tmpValue = new string(
            _baseBytes.length + _valueBytes.length
        );
        bytes memory _newValue = bytes(_tmpValue);
        uint256 i;
        uint256 j;
        for (i = 0; i < _baseBytes.length; i++) {
            _newValue[j++] = _baseBytes[i];
        }
        for (i = 0; i < _valueBytes.length; i++) {
            _newValue[j++] = _valueBytes[i];
        }
        return string(_newValue);
    }
}
