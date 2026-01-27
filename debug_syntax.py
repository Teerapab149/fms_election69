
import re
import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    stack = []
    
    # Simple state machine
    i = 0
    length = len(content)
    line = 1
    col = 1
    
    while i < length:
        char = content[i]
        
        # Check for newlines
        if char == '\n':
            line += 1
            col = 0
        
        # Check for comments
        if i + 1 < length:
            two_chars = content[i:i+2]
            if two_chars == '//':
                # Skip to end of line
                while i < length and content[i] != '\n':
                    i += 1
                line += 1
                col = 0
                i += 1
                continue
            elif two_chars == '/*':
                # Skip to */
                i += 2
                col += 2
                while i + 1 < length and content[i:i+2] != '*/':
                    if content[i] == '\n':
                        line += 1
                        col = 0
                    else:
                        col += 1
                    i += 1
                i += 2
                col += 2
                continue

        # Check for strings
        if char in ["'", '"', '`']:
            quote = char
            start_line = line
            start_col = col
            i += 1
            col += 1
            while i < length:
                if content[i] == quote:
                    # Check for escaping
                    escaped = False
                    back_idx = i - 1
                    while back_idx >= 0 and content[back_idx] == '\\':
                        escaped = not escaped
                        back_idx -= 1
                    if not escaped:
                        break
                
                if content[i] == '\n':
                    line += 1
                    col = 0
                else:
                    col += 1
                i += 1
            if i == length:
                print(f"Error: Unclosed string starting at {start_line}:{start_col}")
                return

        # Check braces
        if char in ['{', '(', '[']:
            stack.append((char, line, col))
        elif char in ['}', ')', ']']:
            if not stack:
                print(f"Error: Unexpected '{char}' at {line}:{col}")
                return
            last_char, last_line, last_col = stack.pop()
            matches = {'}': '{', ')': '(', ']': '['}
            if matches[char] != last_char:
                print(f"Error: Mismatched '{char}' at {line}:{col}. Expected closing for '{last_char}' from {last_line}:{last_col}")
                return
        
        i += 1
        col += 1

    if stack:
        last_char, last_line, last_col = stack[-1]
        print(f"Error: Unclosed '{last_char}' starting at {last_line}:{last_col}")
    else:
        print("Success: All braces balanced.")

if __name__ == "__main__":
    check_balance(sys.argv[1])
