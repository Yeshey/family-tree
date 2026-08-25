{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = { systems, nixpkgs, ... } @ inputs:
    let
      eachSystem = f:
        nixpkgs.lib.genAttrs (import systems) (
          system:
            f nixpkgs.legacyPackages.${system}
        );
    in {
      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24
            pkgs.git
          ];
          shellHook = ''
            echo "Family tree dev environment ready!"
            echo "npm install    - install deps"
            echo "npm run dev    - local dev server"
            echo "npm run deploy - build + push to gh-pages"
          '';
        };
      });
    };
}