// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721XMock is ERC721Enumerable, AccessControl {
    using Strings for uint256;

    string public defaultUri;

    constructor() ERC721("ERC721X", "X") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI query for nonexistent token");
        tokenId %= 16;
        return
            string(
                abi.encodePacked(defaultUri, "/", tokenId.toString(), ".json")
            );
    }

    function mint(address to) public {
        uint256 mintIndex = totalSupply();
        _safeMint(to, mintIndex);
    }

    function setDefaultUri(string memory uri)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        defaultUri = uri;
    }
}