call node-sass styles\sass\styles.scss styles\css\styles.css /C
call tsc -p "scripts\ts\tsconfig.json"
start chrome index.html