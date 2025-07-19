export const LANGUAGE_VERSIONS = {
    python: "3.10.0",
    c: "10.2.0",
    "c++": "10.2.0",
    javascript: "18.15.0",
  };
  
  export const CODE_SNIPPETS = {
    python: `
def sayhello(a):
    print("Hello, " + a + "!")
  
sayhello("world")
  `,
  
    c: `
#include <stdio.h>
  
void sayhello(const char *a) {
    printf("Hello, %s!", a);
}
  
int main() {
    sayhello("world");
    return 0;
}
  `,
  
  "c++": `
#include <iostream>
#include <string>

void sayhello(const std::string &a) {
    std::cout << "Hello, " << a << "!" << std::endl;
}

int main() {
    sayhello("world");
    return 0;
}
  `,
  
    javascript: `
function sayhello(a) {
    console.log("Hello, " + a + "!");
}

sayhello("world");
  `,
  };
  