const cron = require("node-cron");
var nodemailer = require('nodemailer');
const express = require("express");
const dotenv = require('dotenv');
// const AWS = require("aws-sdk");
//     AWS.config.update({ region: "us-east-1" });
const fs = require("fs");
var ndjson = require('ndjson');
const { Console } = require("console");
const { getMaxListeners } = require("process");

app = express();

dotenv.config();

const PORT = 8080;
const HOST = '0.0.0.0';

let dates = [];
let sources = []
let html;
getSimpleISO = () => {
    return (new Date()).toISOString().split('T')[0];
}

PrettyHtmlTable = (title, data) => {
    console.log('DATA: ', data[0]);
    const cols = [
        'Name',
        'GeoPlatform Date',
        'Data.gov Date',
        'Agency Date'
    ];
    const rows = data.map(s => ([
        {name: 'ngda_name',value: s.ngda_name, visible: true},
        {name: 'gp_date', value: s.gp_date, visible: true},
        {name: 'dg_date', value: s.dg_date, visible: true},
        {name: 'agc_date', value: s.agc_date, visible: true}
    ]));
    const htmlCols = cols.map(c => `<th><b>${c}</b></th>`)
                         .join('')
    const htmlRows = rows.map(function(row) { 
                const gpDate = row.find(r => r.name==='gp_date').value;
                return `<tr ">${row.map(r => new Date(r.value) > new Date(gpDate) ? 
                        `<td class="attention">${r.value}</td>` : 
                        `<td class="no-attention">${r.value}</td>`).join('')}</tr>`
            }
        )
        .join('')                    
    return `<h4>${title}</h4>
            <table id="sources">
                <tr>${htmlCols}</tr>
                ${htmlRows}
            </table>`
}
async function sendEmail(){
    
    let sourceList = []; // array of array (rows) to write out
    sourceList.push([
        'NGDA_ID',
        'NGDA_Name',
        'GP_URL',
        'DG_URL',
        'AGC_URL',
        'GP_DATE',
        'DG_DATE',
        'AGC_DATE',
        'HRVST_DATE',
        'PUB_DATE',
        'HRVST_ERR_CT',
        'PUB_ERR_CT',
        'MD_AUDIT'
    ])
    sources
        .map(u => [
            u.ngda_id,
            u.ngda_name,
            u.dg_url,
            u.agc_url,
            u.gp_url,
            u.gp_date,
            u.dg_date,
            u.agc_date,
            u.harvest_date,
            u.publish_date,
            u.harvest_error_count,
            u.publish_error_count,
            u.md_audit
         ])
         .map(row => sourceList.push(row))
    try {
        await emailReport(['tylerdean.w@gmail.com'], html, rowsToCSVString(sourceList))
        console.log("</>")
        
    } catch (e) {
        console.log('Error: ', e)
        r.join(',')
    }
}
function rowsToCSVString(rows){
    return rows
            .map(row => 
                row.join(',')
            )
            .join('\n')
}
async function emailReport(addresses, HTML, csvString) {
    // const subject = `accounts.geoplatform.gov Monthly Report : ${getSimpleISO()}`
    // const FOOTER = `<hr>
    // Geoplatform Tech Team`
    // const sender = "'GeoPlatform Report Engine' <servicedesk@geoplatform.gov>"
    // let ses_mail = `From: ${sender}\n`;
    // ses_mail += `To: ${addresses.join(',')}\n`;
    // ses_mail += `Subject: ${subject}\n`;
    // ses_mail += "MIME-Version: 1.0\n";
    // ses_mail += "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
    // ses_mail += "--NextPart\n";
    // ses_mail += "Content-Type: text/html\n\n";
    // ses_mail += HTML + FOOTER + '\n';
    // ses_mail += "--NextPart\n";
    // ses_mail += `Content-Type: application/octet-stream; name=\"accounts.geoplatform.gov-users-${getSimpleISO()}.csv\"\n`;
    // // ses_mail += "Content-Transfer-Encoding: base64\n";
    // ses_mail += "Content-Disposition: attachment\n\n";
    // ses_mail += csvString + "\n\n";
    // ses_mail += "--NextPart--";
    // const params = {
    //     RawMessage: {Data: ses_mail},
    //     Source: sender
    // };
    // return new AWS.SES()
    //             .sendRawEmail(params)
    //             .promise();
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.FROM_EMAIL,
          pass: process.env.FROM_PASSWORD
        }
      });
      var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: process.env.TO_EMAIL,//'tyler.mccracken@critigen.com',
        subject: `GeoPlatform data report : ${getSimpleISO()}`,
        html: HTML, 
        attachments: [
            // String attachment
            {
                filename: `geoplatform-data-sources-${getSimpleISO()}.csv`,
                content: csvString,
                contentType: 'application/octet-stream' // optional, would be detected from the filename
            }
        ]
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}
makeHTML = () => {
    // console.log(sources);
    let html =
    `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <style>
      #sources {
        font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }
      
      #sources td, #sources th {
        border: 1px solid #ddd;
        padding: 8px;
      }
      .attention {
          color: red
      }
      .no-attention {
          color: #212121
      }
      #sources tr:nth-child(even){background-color: #f2f2f2;}
      
      #sources tr:hover {background-color: #ddd;}
      
      #sources th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #339933;
        color: white;
      }
      </style>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width" />
        <!-- NOTE: external links are for testing only -->
        <link href="//cdn.muicss.com/mui-0.10.3/email/mui-email-styletag.css" rel="stylesheet" />
        <link href="//cdn.muicss.com/mui-0.10.3/email/mui-email-inline.css" rel="stylesheet" />
      </head>
      <body>
        <table class="mui-body" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="mui-panel">
              <center>
                <!--[if mso]><table><tr><td class="mui-container-fixed"><![endif]-->
                <div class="mui-container">
                <table class="mui-body" cellpadding="0" cellspacing="0" border="0">
                <tr>`;
    // General Header
    
    html += `<table >
        <tbody>
        <tr>
        <td style="padding-right: 1em;" ><img src="https://www.geoplatform.gov/wp-content/themes/geoplatform-portal-four/img/logo.svg" alt="GeoPlatform" 
            style="display:block; font-family:Arial, width: 100% !important; height: auto !important; sans-serif; font-size:30px; line-height:34px; 
            color:#000000; max-width:100px;" width="100" border="0" height="345"></td>
        <td>
        <h3>GeoPlatform Accounts Summary</h3>
        Generated: ${getSimpleISO()}
        </td>
        </tr>
        </tbody>
    </table>`
    html += `<div class="mui--divider-bottom">`
    html += '</div>'
    html += '<br><br>'
    console.log('SOURCES: ', sources);

        //filter the sources        
        sources.forEach(s => {
            const gpDate = s.gp_date.split("-"), dgDate = s.dg_date.split("-"), agcDate = s.agc_date.split("-");  
            new Date(gpDate) < new Date(dgDate) ? console.log("dgDate IS greater") : console.log("dgDate IS NOT greater");
            new Date(gpDate) < new Date(agcDate) ? console.log("acgDate IS greater") : console.log("acgDate IS NOT greater");  
        })        
        let filteredSources = sources.filter(s => 
            new Date(s.gp_date.split("-")) < new Date(s.dg_date.split("-")) ||
            new Date(s.gp_date.split("-")) < new Date(s.agc_date.split("-"))
        );
        
    html += PrettyHtmlTable(
            'Filtered Sources (Newer date than GP):',
            filteredSources)
        html += `<div class="mui--divider-top">`
        // html += allSources;
        html += `</div>`
        html += `</tr>
                    </table>
                    </div>
                    <!--[if mso]></td></tr></table><![endif]-->
                    </center>
                </td>
                </tr>
            </table>
            </body>
            </html>`
    return html;
}
fs.createReadStream('ngda_portfolio.txt')
  .pipe(ndjson.parse())
  .on('data', function(obj) {
    const sourceDates = [
        obj.gp_date.split("-"), 
        dgDate = obj.dg_date.split("-"), 
        agcDate = obj.agc_date.split("-")
    ];
    dates.push(sourceDates)
    sources.push(obj);
    console.log('html: ', html);
  })
  .on('end', () => {
    html = makeHTML();
  });  

app.get('/', (req, res) => {
    sendEmail();
    res.send(html);
});
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);