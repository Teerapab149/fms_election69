
import sys

def analyze_nesting(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    level = 0
    
    for i, line_content in enumerate(lines):
        line_num = i + 1
        
        j = 0
        length = len(line_content)
        str_quote = None
        escaped = False
        
        while j < length:
            char = line_content[j]
            # String handling
            if str_quote:
                if char == str_quote and not escaped:
                    str_quote = None
                elif char == '\\':
                    escaped = not escaped
                else:
                    escaped = False
            else:
                if char in ['"', "'", '`']:
                    str_quote = char
                    escaped = False
                elif char == '/' and j + 1 < length:
                    if line_content[j+1] == '/':
                        break 
                    elif line_content[j+1] == '*':
                        pass
                elif char == '{':
                    level += 1
                elif char == '}':
                    level -= 1
            j += 1
        
        if line_num == 272 or line_num == 273:
             print(f"DEBUG Line {line_num} Level: {level}")
        
    print(f"Final Level: {level}")

if __name__ == "__main__":
    analyze_nesting(sys.argv[1])
